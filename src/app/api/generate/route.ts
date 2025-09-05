import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getProviderManager } from '@/lib/providers/manager'
import { ProviderType, GenerationOptions } from '@/lib/providers/types'
import { decrypt } from '@/lib/encryption'
import type { InsertGeneration, UpdateApiKey } from '@/types/supabase'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { prompt, provider, aspectRatio, style, negativePrompt, model, geminiConfig, attachedFiles } = body

    if (!prompt || !provider) {
      return NextResponse.json(
        { success: false, error: 'Prompt and provider are required' },
        { status: 400 }
      )
    }

    // Get user's API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('provider, encrypted_key')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (keysError || !apiKeys || apiKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No API keys configured' },
        { status: 400 }
      )
    }

    // Find the requested provider's API key
    const providerKey = apiKeys.find(key => key.provider === provider)
    if (!providerKey) {
      return NextResponse.json(
        { success: false, error: `No API key found for ${provider}` },
        { status: 400 }
      )
    }

    try {
      // Decrypt the API key
      const decryptedKey = decrypt(providerKey.encrypted_key)
      
      // Initialize provider manager with the specific provider
      const providerManager = getProviderManager()
      await providerManager.addProvider({
        type: provider as ProviderType,
        apiKey: decryptedKey
      })

      // Prepare generation options
      const generationOptions: GenerationOptions = {
        prompt,
        negativePrompt: negativePrompt || undefined,
        aspectRatio: aspectRatio || '1:1',
        style: style || undefined,
        model: model || undefined,
        geminiConfig: provider === 'gemini' ? geminiConfig : undefined,
        attachedFiles: provider === 'gemini' ? attachedFiles : undefined
      }

      // Generate the image
      const startTime = Date.now()
      const result = await providerManager.generateImage(provider as ProviderType, generationOptions)
      const endTime = Date.now()

      if (!result.success) {
        throw new Error(result.error || 'Generation failed')
      }

      // Save generation to database
      const { error: saveError } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          provider,
          prompt,
          negative_prompt: negativePrompt || null,
          model_used: model || result.metadata?.model,
          image_url: result.imageUrl,
          format: aspectRatio || '1:1',
          generation_time_ms: endTime - startTime,
          cost_credits: result.metadata?.cost || 0,
          metadata: result.metadata ? JSON.stringify(result.metadata) : null,
          status: 'completed'
        } satisfies InsertGeneration)

      if (saveError) {
        console.error('Error saving generation:', saveError)
        // Don't fail the request if we can't save to DB
      }

      // Update API key last used timestamp
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() } satisfies UpdateApiKey)
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('is_active', true)

      if (updateError) {
        console.error('Error updating API key timestamp:', updateError)
      }

      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        metadata: {
          ...result.metadata,
          generationTime: endTime - startTime
        }
      })

    } catch (decryptError) {
      console.error('Decryption error:', decryptError)
      return NextResponse.json(
        { success: false, error: 'Failed to access API key' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Generation API error:', error)
    
    // Return appropriate error message
    let errorMessage = 'Internal server error'
    let statusCode = 500

    if (error.message.includes('Invalid API key')) {
      errorMessage = 'Invalid API key for the selected provider'
      statusCode = 400
    } else if (error.message.includes('Rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later'
      statusCode = 429
    } else if (error.message.includes('Prompt')) {
      errorMessage = error.message
      statusCode = 400
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}