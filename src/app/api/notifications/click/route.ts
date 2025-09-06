import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { AuditLogger } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_id, action, timestamp } = body

    if (!notification_id) {
      return NextResponse.json(
        { error: 'notification_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const auditLogger = new AuditLogger()

    // Get notification details
    const { data: notification, error: fetchError } = await supabase
      .from('push_notifications')
      .select('*')
      .eq('id', notification_id)
      .single()

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // Mark as read if not already read
    if (!notification.read_at) {
      await supabase
        .from('push_notifications')
        .update({
          read_at: timestamp || new Date().toISOString()
        })
        .eq('id', notification_id)
    }

    // Log the click event
    await auditLogger.log(
      'notification_clicked',
      'system',
      {
        notification_id,
        notification_type: notification.type,
        action: action || 'click',
        clicked_at: timestamp || new Date().toISOString()
      },
      'info',
      notification.user_id
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Click tracked successfully' 
    })

  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}