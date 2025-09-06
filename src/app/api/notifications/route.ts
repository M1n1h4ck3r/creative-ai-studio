import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { notificationManager } from '@/lib/notifications'

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
      case 'list':
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')
        const unreadOnly = searchParams.get('unread_only') === 'true'
        const type = searchParams.get('type') as any

        const notifications = await notificationManager.getNotifications(user.id, {
          limit,
          offset,
          unread_only: unreadOnly,
          type
        })

        return NextResponse.json({ notifications })

      case 'config':
        const config = await notificationManager.getNotificationConfig(user.id)
        return NextResponse.json({ config })

      case 'stats':
        const stats = await notificationManager.getNotificationStats(user.id)
        return NextResponse.json({ stats })

      case 'sync':
        // Get pending notifications for sync
        const pendingNotifications = await notificationManager.getNotifications(user.id, {
          limit: 10,
          unread_only: true
        })

        return NextResponse.json({ notifications: pendingNotifications })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Notifications API error:', error)
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
      case 'send':
        const { type, variables, options } = body
        const notificationId = await notificationManager.sendNotification(
          user.id,
          type,
          variables,
          options
        )
        return NextResponse.json({ 
          notificationId,
          message: 'Notification sent successfully' 
        })

      case 'subscribe':
        const subscription = await notificationManager.subscribeToPush(user.id)
        return NextResponse.json({ 
          subscription,
          message: 'Subscribed to push notifications' 
        })

      case 'unsubscribe':
        const success = await notificationManager.unsubscribeFromPush(user.id)
        return NextResponse.json({ 
          success,
          message: success ? 'Unsubscribed successfully' : 'Failed to unsubscribe' 
        })

      case 'update_config':
        const { config } = body
        await notificationManager.updateNotificationConfig(user.id, config)
        return NextResponse.json({ message: 'Configuration updated successfully' })

      case 'mark_read':
        const { notificationId: markReadId } = body
        const readSuccess = await notificationManager.markAsRead(markReadId, user.id)
        return NextResponse.json({ 
          success: readSuccess,
          message: readSuccess ? 'Marked as read' : 'Failed to mark as read' 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}