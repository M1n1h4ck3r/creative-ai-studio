import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { backupManager } from '@/lib/backup'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    switch (action) {
      case 'jobs':
        const limit = parseInt(searchParams.get('limit') || '50')
        const jobs = await backupManager.getBackupJobs(user.id, limit)
        return NextResponse.json({ jobs })

      case 'config':
        // Get user's backup configuration
        const { data: configData } = await supabase
          .from('user_settings')
          .select('value')
          .eq('user_id', user.id)
          .eq('key', 'backup_config')
          .single()

        return NextResponse.json({ 
          config: configData?.value || {
            enabled: false,
            frequency: 'weekly',
            retention: 30,
            includeFiles: true,
            includeProjects: true,
            includeUserData: true,
            includeAuditLogs: false,
            destinations: [
              {
                type: 'local',
                name: 'Local Storage',
                config: {},
                enabled: true
              }
            ]
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create':
        const { config, type = 'manual' } = body
        const jobId = await backupManager.createBackup(user.id, config, type)
        return NextResponse.json({ jobId, message: 'Backup started' })

      case 'schedule':
        const { config: scheduleConfig } = body
        await backupManager.scheduleBackup(user.id, scheduleConfig)
        return NextResponse.json({ message: 'Backup scheduled successfully' })

      case 'restore':
        const { backupData, options } = body
        const result = await backupManager.restoreBackup(user.id, backupData, options)
        return NextResponse.json({ result })

      case 'cleanup':
        const { retentionDays = 30 } = body
        const deletedCount = await backupManager.cleanupOldBackups(user.id, retentionDays)
        return NextResponse.json({ deletedCount, message: `${deletedCount} old backups cleaned up` })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    await backupManager.deleteBackupJob(jobId, user.id)
    return NextResponse.json({ message: 'Backup deleted successfully' })

  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}