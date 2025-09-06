import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_id, status, timestamp } = body

    if (!notification_id || !status) {
      return NextResponse.json(
        { error: 'notification_id and status are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Update notification delivery status
    const { error } = await supabase
      .from('push_notifications')
      .update({
        status,
        ...(status === 'delivered' && { sent_at: timestamp || new Date().toISOString() }),
        metadata: {
          delivery_confirmed_at: new Date().toISOString()
        }
      })
      .eq('id', notification_id)

    if (error) {
      console.error('Failed to update notification delivery status:', error)
      return NextResponse.json(
        { error: 'Failed to update delivery status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Delivery status updated' })

  } catch (error) {
    console.error('Delivery tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}