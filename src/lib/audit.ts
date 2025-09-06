// Advanced audit and logging system for Creative AI Studio
import { createClient } from '@supabase/supabase-js'
import { analytics } from './analytics'

export interface AuditLog {
  id: string
  user_id?: string
  action: AuditAction
  resource_type: ResourceType
  resource_id?: string
  details: AuditDetails
  metadata: AuditMetadata
  ip_address?: string
  user_agent?: string
  session_id?: string
  timestamp: string
  severity: LogSeverity
  category: LogCategory
}

export type AuditAction = 
  // User actions
  | 'user_login' | 'user_logout' | 'user_register' | 'user_update' | 'user_delete'
  // API key actions
  | 'api_key_create' | 'api_key_update' | 'api_key_delete' | 'api_key_validate'
  // Generation actions
  | 'image_generate' | 'image_delete' | 'image_download' | 'image_share'
  // Project actions
  | 'project_create' | 'project_update' | 'project_delete' | 'project_share'
  | 'project_member_add' | 'project_member_remove' | 'project_member_role_change'
  // Template actions
  | 'template_create' | 'template_update' | 'template_delete' | 'template_use'
  // System actions
  | 'system_start' | 'system_shutdown' | 'system_error' | 'system_maintenance'
  // Security actions
  | 'security_breach' | 'security_alert' | 'login_failed' | 'rate_limit_exceeded'
  // Admin actions
  | 'admin_user_impersonate' | 'admin_system_config' | 'admin_data_export'

export type ResourceType = 
  | 'user' | 'api_key' | 'generation' | 'project' | 'template' 
  | 'team' | 'webhook' | 'system' | 'security'

export type LogSeverity = 'low' | 'medium' | 'high' | 'critical'
export type LogCategory = 'user' | 'system' | 'security' | 'performance' | 'business'

export interface AuditDetails {
  description: string
  old_value?: any
  new_value?: any
  affected_fields?: string[]
  error_message?: string
  success: boolean
}

export interface AuditMetadata {
  browser?: string
  platform?: string
  screen_resolution?: string
  timezone?: string
  referrer?: string
  duration_ms?: number
  cost?: number
  provider?: string
  model?: string
  [key: string]: any
}

export interface AuditQuery {
  user_id?: string
  action?: AuditAction[]
  resource_type?: ResourceType[]
  severity?: LogSeverity[]
  category?: LogCategory[]
  start_date?: string
  end_date?: string
  search?: string
  limit?: number
  offset?: number
}

export interface AuditStats {
  total_logs: number
  by_action: Record<AuditAction, number>
  by_severity: Record<LogSeverity, number>
  by_category: Record<LogCategory, number>
  by_user: Array<{ user_id: string; count: number }>
  by_date: Array<{ date: string; count: number }>
  top_errors: Array<{ error: string; count: number }>
}

export class AuditLogger {
  private supabase: any

  constructor() {
    if (typeof window !== 'undefined') {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
  }

  // Log an audit event
  async log(
    action: AuditAction,
    resource_type: ResourceType,
    details: AuditDetails,
    options: {
      user_id?: string
      resource_id?: string
      metadata?: Partial<AuditMetadata>
      severity?: LogSeverity
      category?: LogCategory
    } = {}
  ): Promise<boolean> {
    try {
      const audit: Omit<AuditLog, 'id'> = {
        user_id: options.user_id,
        action,
        resource_type,
        resource_id: options.resource_id,
        details,
        metadata: {
          ...this.getDefaultMetadata(),
          ...options.metadata
        },
        ip_address: await this.getClientIP(),
        user_agent: navigator?.userAgent,
        session_id: this.getSessionId(),
        timestamp: new Date().toISOString(),
        severity: options.severity || this.getSeverityForAction(action),
        category: options.category || this.getCategoryForAction(action)
      }

      // Store in database
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(audit)

      if (error) {
        console.error('Failed to log audit event:', error)
        return false
      }

      // Send to analytics
      analytics.trackEvent('audit_log_created', {
        action,
        resource_type,
        severity: audit.severity,
        category: audit.category
      })

      // Handle critical events
      if (audit.severity === 'critical') {
        await this.handleCriticalEvent(audit)
      }

      return true
    } catch (error) {
      console.error('Audit logging error:', error)
      return false
    }
  }

  // Convenience methods for common actions
  async logUserAction(
    user_id: string,
    action: Extract<AuditAction, 'user_login' | 'user_logout' | 'user_register' | 'user_update'>,
    details: Partial<AuditDetails> = {}
  ): Promise<boolean> {
    return this.log(action, 'user', {
      description: this.getActionDescription(action),
      success: true,
      ...details
    }, { user_id, category: 'user' })
  }

  async logGenerationAction(
    user_id: string,
    generation_id: string,
    action: Extract<AuditAction, 'image_generate' | 'image_delete' | 'image_download'>,
    metadata: {
      provider?: string
      model?: string
      cost?: number
      duration_ms?: number
    } = {}
  ): Promise<boolean> {
    return this.log(action, 'generation', {
      description: this.getActionDescription(action),
      success: true
    }, {
      user_id,
      resource_id: generation_id,
      metadata,
      category: 'business'
    })
  }

  async logSecurityEvent(
    action: Extract<AuditAction, 'security_breach' | 'login_failed' | 'rate_limit_exceeded'>,
    details: AuditDetails,
    user_id?: string
  ): Promise<boolean> {
    return this.log(action, 'security', details, {
      user_id,
      severity: 'critical',
      category: 'security'
    })
  }

  async logSystemEvent(
    action: Extract<AuditAction, 'system_start' | 'system_shutdown' | 'system_error'>,
    details: AuditDetails
  ): Promise<boolean> {
    return this.log(action, 'system', details, {
      severity: action === 'system_error' ? 'high' : 'medium',
      category: 'system'
    })
  }

  // Query audit logs
  async query(query: AuditQuery): Promise<{
    logs: AuditLog[]
    total: number
    has_more: boolean
  }> {
    try {
      let dbQuery = this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })

      // Apply filters
      if (query.user_id) {
        dbQuery = dbQuery.eq('user_id', query.user_id)
      }

      if (query.action?.length) {
        dbQuery = dbQuery.in('action', query.action)
      }

      if (query.resource_type?.length) {
        dbQuery = dbQuery.in('resource_type', query.resource_type)
      }

      if (query.severity?.length) {
        dbQuery = dbQuery.in('severity', query.severity)
      }

      if (query.category?.length) {
        dbQuery = dbQuery.in('category', query.category)
      }

      if (query.start_date) {
        dbQuery = dbQuery.gte('timestamp', query.start_date)
      }

      if (query.end_date) {
        dbQuery = dbQuery.lte('timestamp', query.end_date)
      }

      if (query.search) {
        dbQuery = dbQuery.or(`details->>description.ilike.%${query.search}%,action.ilike.%${query.search}%`)
      }

      // Pagination
      const limit = query.limit || 50
      const offset = query.offset || 0
      dbQuery = dbQuery.range(offset, offset + limit - 1)

      const { data, error, count } = await dbQuery

      if (error) {
        throw error
      }

      return {
        logs: data || [],
        total: count || 0,
        has_more: (count || 0) > offset + limit
      }
    } catch (error) {
      console.error('Audit query error:', error)
      return { logs: [], total: 0, has_more: false }
    }
  }

  // Get audit statistics
  async getStats(
    start_date?: string,
    end_date?: string
  ): Promise<AuditStats | null> {
    try {
      // This would require custom SQL queries or aggregation
      // Simplified version for now
      const { logs } = await this.query({
        start_date,
        end_date,
        limit: 10000
      })

      const stats: AuditStats = {
        total_logs: logs.length,
        by_action: {} as Record<AuditAction, number>,
        by_severity: {} as Record<LogSeverity, number>,
        by_category: {} as Record<LogCategory, number>,
        by_user: [],
        by_date: [],
        top_errors: []
      }

      // Aggregate data
      const userCounts: Record<string, number> = {}
      const dateCounts: Record<string, number> = {}
      const errorCounts: Record<string, number> = {}

      logs.forEach(log => {
        // By action
        stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1

        // By severity
        stats.by_severity[log.severity] = (stats.by_severity[log.severity] || 0) + 1

        // By category
        stats.by_category[log.category] = (stats.by_category[log.category] || 0) + 1

        // By user
        if (log.user_id) {
          userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1
        }

        // By date
        const date = new Date(log.timestamp).toISOString().split('T')[0]
        dateCounts[date] = (dateCounts[date] || 0) + 1

        // Errors
        if (!log.details.success && log.details.error_message) {
          errorCounts[log.details.error_message] = (errorCounts[log.details.error_message] || 0) + 1
        }
      })

      // Convert to arrays and sort
      stats.by_user = Object.entries(userCounts)
        .map(([user_id, count]) => ({ user_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      stats.by_date = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      stats.top_errors = Object.entries(errorCounts)
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return stats
    } catch (error) {
      console.error('Audit stats error:', error)
      return null
    }
  }

  // Export audit logs
  async exportLogs(
    query: AuditQuery,
    format: 'json' | 'csv' = 'json'
  ): Promise<{ data: string; filename: string } | null> {
    try {
      const { logs } = await this.query({ ...query, limit: 10000 })

      if (format === 'json') {
        return {
          data: JSON.stringify(logs, null, 2),
          filename: `audit-logs-${new Date().toISOString().split('T')[0]}.json`
        }
      } else {
        // CSV format
        const headers = [
          'Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID',
          'Description', 'Success', 'Severity', 'Category', 'IP Address'
        ]

        const rows = logs.map(log => [
          log.timestamp,
          log.user_id || '',
          log.action,
          log.resource_type,
          log.resource_id || '',
          log.details.description,
          log.details.success,
          log.severity,
          log.category,
          log.ip_address || ''
        ])

        const csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n')

        return {
          data: csvContent,
          filename: `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        }
      }
    } catch (error) {
      console.error('Export logs error:', error)
      return null
    }
  }

  // Utility methods
  private getDefaultMetadata(): AuditMetadata {
    if (typeof window === 'undefined') return {}

    return {
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
               navigator.userAgent.includes('Firefox') ? 'Firefox' :
               navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown',
      platform: navigator.platform,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer
    }
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      // In production, this would be handled server-side
      return undefined
    } catch {
      return undefined
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('audit_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('audit_session_id', sessionId)
    }
    return sessionId
  }

  private getSeverityForAction(action: AuditAction): LogSeverity {
    const severityMap: Partial<Record<AuditAction, LogSeverity>> = {
      'security_breach': 'critical',
      'system_error': 'high',
      'login_failed': 'medium',
      'rate_limit_exceeded': 'medium',
      'user_delete': 'high',
      'project_delete': 'medium',
      'admin_user_impersonate': 'high',
      'system_shutdown': 'medium',
      'system_start': 'low'
    }

    return severityMap[action] || 'low'
  }

  private getCategoryForAction(action: AuditAction): LogCategory {
    if (action.startsWith('user_')) return 'user'
    if (action.startsWith('security_') || action === 'login_failed') return 'security'
    if (action.startsWith('system_')) return 'system'
    if (['image_generate', 'template_use', 'project_create'].includes(action)) return 'business'
    return 'user'
  }

  private getActionDescription(action: AuditAction): string {
    const descriptions: Record<AuditAction, string> = {
      'user_login': 'User logged in',
      'user_logout': 'User logged out',
      'user_register': 'User registered',
      'user_update': 'User profile updated',
      'user_delete': 'User account deleted',
      'api_key_create': 'API key created',
      'api_key_update': 'API key updated',
      'api_key_delete': 'API key deleted',
      'api_key_validate': 'API key validated',
      'image_generate': 'Image generated',
      'image_delete': 'Image deleted',
      'image_download': 'Image downloaded',
      'image_share': 'Image shared',
      'project_create': 'Project created',
      'project_update': 'Project updated',
      'project_delete': 'Project deleted',
      'project_share': 'Project shared',
      'project_member_add': 'Project member added',
      'project_member_remove': 'Project member removed',
      'project_member_role_change': 'Project member role changed',
      'template_create': 'Template created',
      'template_update': 'Template updated',
      'template_delete': 'Template deleted',
      'template_use': 'Template used',
      'system_start': 'System started',
      'system_shutdown': 'System shutdown',
      'system_error': 'System error occurred',
      'system_maintenance': 'System maintenance',
      'security_breach': 'Security breach detected',
      'security_alert': 'Security alert triggered',
      'login_failed': 'Login attempt failed',
      'rate_limit_exceeded': 'Rate limit exceeded',
      'admin_user_impersonate': 'Admin impersonated user',
      'admin_system_config': 'Admin changed system config',
      'admin_data_export': 'Admin exported data'
    }

    return descriptions[action] || 'Unknown action'
  }

  private async handleCriticalEvent(audit: Omit<AuditLog, 'id'>): Promise<void> {
    // In production, this would:
    // 1. Send alerts to administrators
    // 2. Trigger security protocols
    // 3. Log to external monitoring systems
    // 4. Potentially disable accounts or features

    console.error('CRITICAL AUDIT EVENT:', audit)
    
    // Track critical events separately
    analytics.trackEvent('critical_audit_event', {
      action: audit.action,
      resource_type: audit.resource_type,
      user_id: audit.user_id
    })
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()

// Middleware function for automatic logging
export const withAuditLog = (
  action: AuditAction,
  resource_type: ResourceType
) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const start = Date.now()
      let success = true
      let error_message: string | undefined

      try {
        const result = await method.apply(this, args)
        
        await auditLogger.log(action, resource_type, {
          description: auditLogger['getActionDescription'](action),
          success: true
        }, {
          metadata: {
            duration_ms: Date.now() - start
          }
        })

        return result
      } catch (error) {
        success = false
        error_message = error instanceof Error ? error.message : 'Unknown error'
        
        await auditLogger.log(action, resource_type, {
          description: auditLogger['getActionDescription'](action),
          success: false,
          error_message
        }, {
          metadata: {
            duration_ms: Date.now() - start
          }
        })

        throw error
      }
    }
  }
}