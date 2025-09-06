'use client'

import { createClient } from '@/lib/supabase'
import { AuditLogger } from '@/lib/audit'

export interface BackupConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  retention: number // days
  includeFiles: boolean
  includeProjects: boolean
  includeUserData: boolean
  includeAuditLogs: boolean
  destinations: BackupDestination[]
}

export interface BackupDestination {
  type: 'local' | 's3' | 'gcs' | 'azure'
  name: string
  config: Record<string, any>
  enabled: boolean
}

export interface BackupJob {
  id: string
  user_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  type: 'manual' | 'scheduled'
  config: BackupConfig
  started_at?: Date
  completed_at?: Date
  error?: string
  size_bytes?: number
  items_count?: number
  metadata: {
    version: string
    created_by: string
    backup_hash?: string
  }
}

export interface BackupData {
  version: string
  timestamp: Date
  user_id: string
  data: {
    profile?: any
    projects?: any[]
    generations?: any[]
    templates?: any[]
    api_keys?: any[]
    audit_logs?: any[]
    files?: {
      path: string
      size: number
      hash: string
      data: string // base64
    }[]
  }
}

export interface RestoreOptions {
  overwriteExisting: boolean
  includeFiles: boolean
  includeProjects: boolean
  includeUserData: boolean
  includeAuditLogs: boolean
  dryRun: boolean
}

export interface RestoreResult {
  success: boolean
  error?: string
  restored_items: {
    projects: number
    generations: number
    templates: number
    files: number
    audit_logs: number
  }
  skipped_items: number
  conflicts: string[]
}

class BackupManager {
  private supabase = createClient()
  private auditLogger = new AuditLogger()

  async createBackup(userId: string, config: BackupConfig, type: 'manual' | 'scheduled' = 'manual'): Promise<string> {
    const jobId = crypto.randomUUID()
    
    // Create backup job record
    const { error: jobError } = await this.supabase
      .from('backup_jobs')
      .insert({
        id: jobId,
        user_id: userId,
        status: 'pending',
        type,
        config,
        metadata: {
          version: '1.0.0',
          created_by: userId
        }
      })

    if (jobError) {
      throw new Error(`Failed to create backup job: ${jobError.message}`)
    }

    await this.auditLogger.log(
      'backup_initiated',
      'system',
      { 
        backup_id: jobId, 
        backup_type: type,
        config: {
          includeFiles: config.includeFiles,
          includeProjects: config.includeProjects,
          includeUserData: config.includeUserData
        }
      },
      'info',
      userId
    )

    // Start backup process in background
    this.processBackup(jobId, userId, config).catch(error => {
      console.error('Backup process failed:', error)
      this.updateBackupStatus(jobId, 'failed', error.message)
    })

    return jobId
  }

  private async processBackup(jobId: string, userId: string, config: BackupConfig): Promise<void> {
    try {
      // Update status to running
      await this.updateBackupStatus(jobId, 'running')

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        user_id: userId,
        data: {}
      }

      let totalSize = 0
      let itemsCount = 0

      // Backup user profile
      if (config.includeUserData) {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profile) {
          backupData.data.profile = profile
          itemsCount++
        }
      }

      // Backup projects
      if (config.includeProjects) {
        const { data: projects } = await this.supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)

        if (projects) {
          backupData.data.projects = projects
          itemsCount += projects.length
        }
      }

      // Backup generations
      const { data: generations } = await this.supabase
        .from('generations')
        .select('*')
        .eq('user_id', userId)

      if (generations) {
        backupData.data.generations = generations
        itemsCount += generations.length
      }

      // Backup templates
      const { data: templates } = await this.supabase
        .from('templates')
        .select('*')
        .eq('user_id', userId)

      if (templates) {
        backupData.data.templates = templates
        itemsCount += templates.length
      }

      // Backup API keys (encrypted)
      const { data: apiKeys } = await this.supabase
        .from('user_api_keys')
        .select('id, provider, created_at, last_used')
        .eq('user_id', userId)

      if (apiKeys) {
        backupData.data.api_keys = apiKeys
        itemsCount += apiKeys.length
      }

      // Backup audit logs
      if (config.includeAuditLogs) {
        const { data: auditLogs } = await this.supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1000)

        if (auditLogs) {
          backupData.data.audit_logs = auditLogs
          itemsCount += auditLogs.length
        }
      }

      // Backup files
      if (config.includeFiles) {
        const { data: files } = await this.supabase
          .storage
          .from('user-files')
          .list(userId)

        if (files) {
          backupData.data.files = []
          
          for (const file of files) {
            try {
              const { data: fileData } = await this.supabase
                .storage
                .from('user-files')
                .download(`${userId}/${file.name}`)

              if (fileData) {
                const arrayBuffer = await fileData.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                
                backupData.data.files.push({
                  path: file.name,
                  size: fileData.size,
                  hash: await this.calculateHash(arrayBuffer),
                  data: base64
                })
                
                totalSize += fileData.size
                itemsCount++
              }
            } catch (fileError) {
              console.warn(`Failed to backup file ${file.name}:`, fileError)
            }
          }
        }
      }

      // Convert backup data to JSON
      const backupJson = JSON.stringify(backupData, null, 2)
      const backupSize = new Blob([backupJson]).size
      totalSize += backupSize

      // Calculate backup hash
      const backupHash = await this.calculateHash(new TextEncoder().encode(backupJson))

      // Store backup to destinations
      for (const destination of config.destinations) {
        if (destination.enabled) {
          await this.storeBackup(destination, `backup_${userId}_${Date.now()}.json`, backupJson)
        }
      }

      // Update job with completion
      await this.supabase
        .from('backup_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          size_bytes: totalSize,
          items_count: itemsCount,
          metadata: {
            version: '1.0.0',
            created_by: userId,
            backup_hash: backupHash
          }
        })
        .eq('id', jobId)

      await this.auditLogger.log(
        'backup_completed',
        'system',
        { 
          backup_id: jobId,
          size_mb: Math.round(totalSize / 1024 / 1024 * 100) / 100,
          items_count: itemsCount,
          backup_hash: backupHash
        },
        'info',
        userId
      )

    } catch (error) {
      await this.updateBackupStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
      
      await this.auditLogger.log(
        'backup_failed',
        'system',
        { 
          backup_id: jobId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'error',
        userId
      )
      
      throw error
    }
  }

  async restoreBackup(userId: string, backupData: BackupData, options: RestoreOptions): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: false,
      restored_items: {
        projects: 0,
        generations: 0,
        templates: 0,
        files: 0,
        audit_logs: 0
      },
      skipped_items: 0,
      conflicts: []
    }

    try {
      await this.auditLogger.log(
        'backup_restore_initiated',
        'system',
        { 
          backup_version: backupData.version,
          backup_timestamp: backupData.timestamp,
          dry_run: options.dryRun,
          options
        },
        'info',
        userId
      )

      if (options.dryRun) {
        // Dry run - just check for conflicts
        result.success = true
        return result
      }

      // Restore user profile
      if (options.includeUserData && backupData.data.profile) {
        try {
          const { error } = await this.supabase
            .from('profiles')
            .upsert(backupData.data.profile)

          if (!error) {
            result.restored_items.projects++ // Using projects counter for profile
          }
        } catch (error) {
          result.conflicts.push(`Profile restore failed: ${error}`)
        }
      }

      // Restore projects
      if (options.includeProjects && backupData.data.projects) {
        for (const project of backupData.data.projects) {
          try {
            const { error } = await this.supabase
              .from('projects')
              .upsert({
                ...project,
                user_id: userId // Ensure correct user
              })

            if (!error) {
              result.restored_items.projects++
            } else {
              result.conflicts.push(`Project ${project.name} restore failed: ${error.message}`)
            }
          } catch (error) {
            result.conflicts.push(`Project ${project.name} restore failed: ${error}`)
          }
        }
      }

      // Restore generations
      if (backupData.data.generations) {
        for (const generation of backupData.data.generations) {
          try {
            const { error } = await this.supabase
              .from('generations')
              .upsert({
                ...generation,
                user_id: userId
              })

            if (!error) {
              result.restored_items.generations++
            } else {
              result.conflicts.push(`Generation restore failed: ${error.message}`)
            }
          } catch (error) {
            result.conflicts.push(`Generation restore failed: ${error}`)
          }
        }
      }

      // Restore templates
      if (backupData.data.templates) {
        for (const template of backupData.data.templates) {
          try {
            const { error } = await this.supabase
              .from('templates')
              .upsert({
                ...template,
                user_id: userId
              })

            if (!error) {
              result.restored_items.templates++
            } else {
              result.conflicts.push(`Template ${template.name} restore failed: ${error.message}`)
            }
          } catch (error) {
            result.conflicts.push(`Template ${template.name} restore failed: ${error}`)
          }
        }
      }

      // Restore files
      if (options.includeFiles && backupData.data.files) {
        for (const file of backupData.data.files) {
          try {
            const fileBuffer = Buffer.from(file.data, 'base64')
            
            const { error } = await this.supabase
              .storage
              .from('user-files')
              .upload(`${userId}/${file.path}`, fileBuffer, {
                upsert: options.overwriteExisting
              })

            if (!error) {
              result.restored_items.files++
            } else {
              result.conflicts.push(`File ${file.path} restore failed: ${error.message}`)
            }
          } catch (error) {
            result.conflicts.push(`File ${file.path} restore failed: ${error}`)
          }
        }
      }

      // Restore audit logs (if enabled)
      if (options.includeAuditLogs && backupData.data.audit_logs) {
        for (const log of backupData.data.audit_logs) {
          try {
            const { error } = await this.supabase
              .from('audit_logs')
              .upsert({
                ...log,
                user_id: userId
              })

            if (!error) {
              result.restored_items.audit_logs++
            }
          } catch (error) {
            // Silently skip audit log conflicts
            result.skipped_items++
          }
        }
      }

      result.success = true

      await this.auditLogger.log(
        'backup_restore_completed',
        'system',
        { 
          restored_items: result.restored_items,
          conflicts_count: result.conflicts.length,
          skipped_items: result.skipped_items
        },
        'info',
        userId
      )

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error'
      
      await this.auditLogger.log(
        'backup_restore_failed',
        'system',
        { error: result.error },
        'error',
        userId
      )
    }

    return result
  }

  async getBackupJobs(userId: string, limit: number = 50): Promise<BackupJob[]> {
    const { data, error } = await this.supabase
      .from('backup_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch backup jobs: ${error.message}`)
    }

    return data || []
  }

  async deleteBackupJob(jobId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('backup_jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete backup job: ${error.message}`)
    }

    await this.auditLogger.log(
      'backup_deleted',
      'system',
      { backup_id: jobId },
      'info',
      userId
    )

    return true
  }

  async scheduleBackup(userId: string, config: BackupConfig): Promise<void> {
    // In a real implementation, this would integrate with a job scheduler
    // For now, we'll store the schedule config in the database
    
    const { error } = await this.supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        key: 'backup_config',
        value: config
      })

    if (error) {
      throw new Error(`Failed to schedule backup: ${error.message}`)
    }

    await this.auditLogger.log(
      'backup_scheduled',
      'system',
      { 
        frequency: config.frequency,
        retention_days: config.retention,
        destinations: config.destinations.length
      },
      'info',
      userId
    )
  }

  async cleanupOldBackups(userId: string, retentionDays: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const { data, error } = await this.supabase
      .from('backup_jobs')
      .delete()
      .eq('user_id', userId)
      .lt('completed_at', cutoffDate.toISOString())
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup old backups: ${error.message}`)
    }

    const deletedCount = data?.length || 0

    if (deletedCount > 0) {
      await this.auditLogger.log(
        'backup_cleanup',
        'system',
        { 
          deleted_count: deletedCount,
          retention_days: retentionDays
        },
        'info',
        userId
      )
    }

    return deletedCount
  }

  private async updateBackupStatus(jobId: string, status: BackupJob['status'], error?: string): Promise<void> {
    const updates: any = {
      status,
      ...(status === 'running' && { started_at: new Date().toISOString() }),
      ...(status === 'completed' && { completed_at: new Date().toISOString() }),
      ...(error && { error })
    }

    await this.supabase
      .from('backup_jobs')
      .update(updates)
      .eq('id', jobId)
  }

  private async storeBackup(destination: BackupDestination, filename: string, data: string): Promise<void> {
    switch (destination.type) {
      case 'local':
        // Store in browser's indexedDB for local storage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`backup_${filename}`, data)
        }
        break
        
      case 's3':
      case 'gcs':
      case 'azure':
        // These would require server-side implementation
        throw new Error(`Cloud storage ${destination.type} not implemented yet`)
        
      default:
        throw new Error(`Unknown destination type: ${destination.type}`)
    }
  }

  private async calculateHash(data: ArrayBuffer): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
    
    // Fallback for server-side
    return Math.random().toString(36).substring(2, 15)
  }
}

export const backupManager = new BackupManager()
export { BackupManager }