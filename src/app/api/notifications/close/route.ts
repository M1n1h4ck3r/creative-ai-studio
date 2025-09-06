import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_id, timestamp } = body

    if (!notification_id) {
      return NextResponse.json(
        { error: 'notification_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Update notification metadata with close timestamp
    const { data: notification, error: fetchError } = await supabase
      .from('push_notifications')
      .select('metadata')
      .eq('id', notification_id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updatedMetadata = {
      ...notification.metadata,
      closed_at: timestamp || new Date().toISOString()
    }

    const { error } = await supabase
      .from('push_notifications')
      .update({
        metadata: updatedMetadata
      })
      .eq('id', notification_id)

    if (error) {
      console.error('Failed to update notification close status:', error)
      return NextResponse.json(
        { error: 'Failed to update close status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Close event tracked successfully' 
    })

  } catch (error) {
    console.error('Close tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}