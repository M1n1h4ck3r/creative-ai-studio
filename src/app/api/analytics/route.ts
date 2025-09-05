import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { event, properties } = await request.json()
    
    if (!event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    // Store analytics event in database
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: event,
        properties: properties || {},
        created_at: new Date().toISOString(),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        referer: request.headers.get('referer'),
      })

    if (error) {
      console.error('Analytics storage error:', error)
      return NextResponse.json({ error: 'Failed to store analytics' }, { status: 500 })
    }

    // Forward to external analytics services
    const promises = []

    // Send to Mixpanel if configured
    if (process.env.MIXPANEL_SECRET_KEY) {
      promises.push(
        fetch('https://api.mixpanel.com/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{
            event,
            properties: {
              ...properties,
              token: process.env.MIXPANEL_SECRET_KEY,
              time: Math.floor(Date.now() / 1000),
            }
          }])
        }).catch(err => console.warn('Mixpanel forward failed:', err))
      )
    }

    // Send to custom webhook if configured
    if (process.env.ANALYTICS_WEBHOOK_URL) {
      promises.push(
        fetch(process.env.ANALYTICS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_WEBHOOK_SECRET || ''}`
          },
          body: JSON.stringify({ event, properties })
        }).catch(err => console.warn('Webhook forward failed:', err))
      )
    }

    // Wait for all external services (but don't fail if they fail)
    await Promise.allSettled(promises)

    return NextResponse.json({ success: true, event_id: data?.[0]?.id })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get analytics data (for dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end_date') || new Date().toISOString()
    const eventType = searchParams.get('event_type')

    let query = supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (eventType) {
      query = query.eq('event_name', eventType)
    }

    const { data, error } = await query.limit(1000)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Group by event type for summary
    const eventSummary = data?.reduce((acc, event) => {
      acc[event.event_name] = (acc[event.event_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      events: data,
      summary: eventSummary,
      total_events: data?.length || 0,
      date_range: { start_date: startDate, end_date: endDate }
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}