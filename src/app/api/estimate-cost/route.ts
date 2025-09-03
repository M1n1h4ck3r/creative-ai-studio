import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getProviderManager } from '@/lib/providers/manager'
import { ProviderType, GenerationOptions } from '@/lib/providers/types'
import { decrypt } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { prompt, provider, aspectRatio, style, model, quality } = body

    if (!prompt || !provider) {
      return NextResponse.json(
        { error: 'Prompt and provider are required' },
        { status: 400 }
      )
    }

    // Get user's API keys to verify they have access to this provider
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('provider, encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('is_active', true)
      .limit(1)

    if (keysError || !apiKeys || apiKeys.length === 0) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}` },
        { status: 400 }
      )
    }

    try {
      // Decrypt the API key and initialize provider
      const decryptedKey = decrypt(apiKeys[0].encrypted_key)
      
      const providerManager = getProviderManager()
      await providerManager.addProvider({
        type: provider as ProviderType,
        apiKey: decryptedKey
      })

      // Prepare generation options for cost estimation
      const generationOptions: GenerationOptions = {
        prompt,
        aspectRatio: aspectRatio || '1:1',
        style: style || undefined,
        model: model || undefined,
        quality: quality || 'standard'
      }

      // Get cost estimate
      const estimate = providerManager.estimateCost(provider as ProviderType, generationOptions)

      if (!estimate) {
        throw new Error('Unable to estimate cost for this provider')
      }

      return NextResponse.json({
        provider,
        cost: estimate.usdCost,
        credits: estimate.credits,
        description: estimate.description
      })

    } catch (providerError: any) {
      console.error('Provider error:', providerError)
      return NextResponse.json(
        { error: 'Failed to estimate cost' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Cost estimation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}