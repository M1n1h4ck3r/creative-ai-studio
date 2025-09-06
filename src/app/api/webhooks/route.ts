import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analytics } from '@/lib/analytics'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default-webhook-secret'

interface WebhookPayload {
  event: string
  data: any
  timestamp: string
  source: string
}

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  active: boolean
  secret?: string
  headers?: Record<string, string>
  created_at: string
  user_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-webhook-signature')
    const body = await request.text()

    // Verify webhook signature (basic implementation)
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload: WebhookPayload = JSON.parse(body)
    
    // Process the webhook event
    await processWebhookEvent(payload)

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed' 
    }, { status: 500 })
  }
}

// Get webhook configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let query = supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: webhooks, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ webhooks })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch webhooks' 
    }, { status: 500 })
  }
}

// Create new webhook
export async function PUT(request: NextRequest) {
  try {
    const { name, url, events, headers, user_id } = await request.json()

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, url, events' 
      }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ 
        error: 'Invalid URL format' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const webhookConfig: Partial<WebhookConfig> = {
      name,
      url,
      events,
      headers: headers || {},
      active: true,
      user_id
    }

    const { data, error } = await supabase
      .from('webhooks')
      .insert(webhookConfig)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Track webhook creation
    analytics.user.webhookCreated(name, events.length)

    return NextResponse.json({ 
      success: true, 
      webhook: data 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to create webhook' 
    }, { status: 500 })
  }
}

// Update webhook
export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ 
        error: 'Webhook ID is required' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('webhooks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      webhook: data 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update webhook' 
    }, { status: 500 })
  }
}

// Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ 
        error: 'Webhook ID is required' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook deleted successfully' 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to delete webhook' 
    }, { status: 500 })
  }
}

// Process webhook events
async function processWebhookEvent(payload: WebhookPayload) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get all active webhooks that listen to this event
  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('active', true)
    .contains('events', [payload.event])

  if (error || !webhooks) {
    console.error('Failed to fetch webhooks:', error)
    return
  }

  // Send webhook to all registered endpoints
  const webhookPromises = webhooks.map(webhook => 
    sendWebhook(webhook, payload)
  )

  await Promise.allSettled(webhookPromises)
}

// Send webhook to endpoint
async function sendWebhook(webhook: WebhookConfig, payload: WebhookPayload) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Creative-AI-Studio-Webhook/1.0',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': payload.timestamp,
      ...webhook.headers
    }

    // Add signature if webhook has secret
    if (webhook.secret) {
      const signature = generateSignature(JSON.stringify(payload), webhook.secret)
      headers['X-Webhook-Signature'] = signature
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    // Log webhook delivery
    await logWebhookDelivery(webhook.id, payload.event, response.status, response.ok)

    if (!response.ok) {
      console.error(`Webhook ${webhook.name} failed:`, response.status, response.statusText)
    }
  } catch (error) {
    console.error(`Webhook ${webhook.name} error:`, error)
    await logWebhookDelivery(webhook.id, payload.event, 0, false)
  }
}

// Log webhook delivery attempts
async function logWebhookDelivery(
  webhookId: string, 
  event: string, 
  statusCode: number, 
  success: boolean
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhookId,
        event,
        status_code: statusCode,
        success,
        delivered_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log webhook delivery:', error)
  }
}

// Verify webhook signature
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  
  // Simple signature verification (in production, use HMAC)
  const expectedSignature = generateSignature(body, WEBHOOK_SECRET)
  return signature === expectedSignature
}

// Generate webhook signature
function generateSignature(payload: string, secret: string): string {
  // In production, use crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return Buffer.from(payload + secret).toString('base64')
}

// Trigger webhook for specific events
export async function triggerWebhook(event: string, data: any, source: string = 'system') {
  try {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      source
    }

    await processWebhookEvent(payload)
    
    // Track webhook trigger
    analytics.user.webhookTriggered(event, source)
  } catch (error) {
    console.error('Failed to trigger webhook:', error)
  }
}

// Common webhook events
export const WEBHOOK_EVENTS = {
  // Image generation events
  IMAGE_GENERATED: 'image.generated',
  IMAGE_GENERATION_FAILED: 'image.generation_failed',
  
  // User events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  
  // API key events
  API_KEY_ADDED: 'api_key.added',
  API_KEY_UPDATED: 'api_key.updated',
  API_KEY_REMOVED: 'api_key.removed',
  
  // System events
  SYSTEM_ERROR: 'system.error',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  
  // Analytics events
  ANALYTICS_EXPORT: 'analytics.export',
  
  // Custom events
  CUSTOM: 'custom.event'
} as const