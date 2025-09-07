import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getProviderManager } from '@/lib/providers/manager'
import { ProviderType, GenerationOptions } from '@/lib/providers/types'
import { decrypt } from '@/lib/encryption'
import { analytics } from '@/lib/analytics'

// Rate limiting
const rateLimits = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(apiKey: string, limit: number): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  
  const current = rateLimits.get(apiKey) || { count: 0, lastReset: now }
  
  // Reset window if needed
  if (now - current.lastReset > windowMs) {
    current.count = 0
    current.lastReset = now
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  rateLimits.set(apiKey, current)
  return true
}

async function authenticateAPIKey(apiKey: string) {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('developer_api_keys')
    .select(`
      id,
      user_id,
      name,
      rate_limit,
      usage_count,
      scopes,
      is_active,
      users!inner(id, email)
    `)
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  // Update last_used_at and usage_count
  await supabase
    .from('developer_api_keys')
    .update({ 
      last_used_at: new Date().toISOString(),
      usage_count: (data.usage_count || 0) + 1
    })
    .eq('id', data.id)

  return data
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Missing or invalid Authorization header',
          code: 'UNAUTHORIZED',
          message: 'Please provide a valid API key in the Authorization header: Bearer <your-api-key>'
        },
        { status: 401 }
      )
    }

    const apiKey = authHeader.replace('Bearer ', '')
    
    // Authenticate API key
    const keyData = await authenticateAPIKey(apiKey)
    if (!keyData) {
      return NextResponse.json(
        { 
          error: 'Invalid API key',
          code: 'INVALID_API_KEY',
          message: 'The provided API key is invalid or inactive'
        },
        { status: 401 }
      )
    }

    // Check rate limit
    if (!checkRateLimit(apiKey, keyData.rate_limit)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit of ${keyData.rate_limit} requests per minute exceeded`,
          rateLimitReset: new Date(Date.now() + 60000).toISOString()
        },
        { status: 429 }
      )
    }

    // Check scopes
    if (!keyData.scopes.includes('generate')) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_SCOPE',
          message: 'This API key does not have generate permissions'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { prompt, provider = 'openai', aspectRatio = '1:1', style, model, quality = 'standard' } = body

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { 
          error: 'Prompt is required',
          code: 'MISSING_PROMPT',
          message: 'Please provide a prompt for image generation'
        },
        { status: 400 }
      )
    }

    // Get user's AI provider API keys
    const supabase = createServerClient()
    const { data: aiApiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('provider, encrypted_key')
      .eq('user_id', keyData.user_id)
      .eq('provider', provider)
      .eq('is_active', true)
      .limit(1)

    if (keysError || !aiApiKeys || aiApiKeys.length === 0) {
      return NextResponse.json(
        { 
          error: `No API key configured for ${provider}`,
          code: 'NO_PROVIDER_KEY',
          message: `User has not configured an API key for the ${provider} provider`
        },
        { status: 400 }
      )
    }

    try {
      // Decrypt the AI provider API key
      const decryptedKey = decrypt(aiApiKeys[0].encrypted_key)
      
      const providerManager = getProviderManager()
      await providerManager.addProvider({
        type: provider as ProviderType,
        apiKey: decryptedKey
      })

      // Prepare generation options
      const generationOptions: GenerationOptions = {
        prompt: prompt.trim(),
        aspectRatio: aspectRatio || '1:1',
        style: style || undefined,
        model: model || undefined,
        quality: quality || 'standard'
      }

      // Track generation start
      analytics.imageGeneration.started(provider, prompt)

      // Generate image
      const result = await providerManager.generateImage(provider as ProviderType, generationOptions)

      const duration = Date.now() - startTime
      
      // Track successful generation
      analytics.imageGeneration.completed(provider, duration, true)

      // Save to history
      const { error: historyError } = await supabase
        .from('image_history')
        .insert({
          user_id: keyData.user_id,
          prompt: prompt.trim(),
          provider: provider,
          image_url: result.url,
          aspect_ratio: aspectRatio,
          style: style,
          model: model,
          quality: quality,
          cost_usd: result.cost?.usdCost || 0,
          api_key_id: keyData.id // Track which API key was used
        })

      if (historyError) {
        console.error('Failed to save to history:', historyError)
      }

      // Return successful response
      return NextResponse.json({
        success: true,
        data: {
          imageUrl: result.url,
          prompt: prompt.trim(),
          provider: provider,
          aspectRatio: aspectRatio,
          generationTime: duration,
          cost: result.cost,
          metadata: result.metadata
        },
        usage: {
          rateLimitRemaining: keyData.rate_limit - (rateLimits.get(apiKey)?.count || 0),
          rateLimitReset: new Date(Date.now() + 60000).toISOString()
        }
      })

    } catch (providerError: any) {
      const duration = Date.now() - startTime
      
      console.error('Provider error:', providerError)
      analytics.imageGeneration.failed(provider, providerError.message)
      
      return NextResponse.json(
        { 
          error: 'Image generation failed',
          code: 'GENERATION_FAILED',
          message: providerError.message || 'An error occurred during image generation',
          provider: provider
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    const duration = Date.now() - startTime
    
    console.error('Developer API error:', error)
    analytics.error.caught(error, 'developer-api')
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    )
  }
}