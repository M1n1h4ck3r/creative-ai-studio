import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getProviderManager } from '@/lib/providers/manager'
import { ProviderType, GenerationOptions } from '@/lib/providers/types'
import { decrypt } from '@/lib/encryption'
import type { InsertGeneration, UpdateApiKey } from '@/types/supabase'

export async function POST(request: NextRequest) {
  console.log('Generate API called')
  try {
    // Skip auth in development when Supabase is not available
    const isDevelopment = process.env.NODE_ENV === 'development'
    let user: any = null
    
    if (!isDevelopment) {
      // Authenticate user in production
      const supabase = createServerClient()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      console.log('Auth check:', { user: !!authUser, authError: !!authError })
      
      if (authError || !authUser) {
        console.log('Auth failed:', authError?.message)
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      user = authUser
    } else {
      console.log('Development mode: skipping auth')
      user = { id: 'dev-user' } // Mock user for development
    }

    const body = await request.json()
    const { prompt, provider, aspectRatio, style, negativePrompt, model, geminiConfig, attachedFiles } = body

    if (!prompt || !provider) {
      return NextResponse.json(
        { success: false, error: 'Prompt and provider are required' },
        { status: 400 }
      )
    }

    let decryptedKey: string
    
    if (isDevelopment) {
      // Use environment API key in development
      if (provider === 'gemini') {
        decryptedKey = process.env.GEMINI_API_KEY!
      } else if (provider === 'openai') {
        decryptedKey = process.env.OPENAI_API_KEY!
      } else {
        return NextResponse.json(
          { success: false, error: `Provider ${provider} not supported in development` },
          { status: 400 }
        )
      }
      
      if (!decryptedKey) {
        return NextResponse.json(
          { success: false, error: `No environment API key found for ${provider}` },
          { status: 400 }
        )
      }
      
      console.log(`Using environment API key for ${provider}`)
    } else {
      // Get user's API keys from database in production
      const supabase = createServerClient()
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
      const providerKey = apiKeys.find((key: any) => key.provider === provider)
      if (!providerKey) {
        return NextResponse.json(
          { success: false, error: `No API key found for ${provider}` },
          { status: 400 }
        )
      }

      try {
        // Decrypt the API key
        decryptedKey = decrypt(providerKey.encrypted_key)
      } catch (decryptError) {
        console.error('Decryption error:', decryptError)
        return NextResponse.json(
          { success: false, error: 'Failed to access API key' },
          { status: 500 }
        )
      }
    }
      
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
    
    // Debug log para verificar arquivos anexados
    if (provider === 'gemini' && attachedFiles) {
      console.log('Attached files being sent to Gemini:', attachedFiles.length, 'files')
      attachedFiles.forEach((file: any, index: number) => {
        console.log(`File ${index}:`, {
          name: file.name,
          type: file.type,
          size: file.size,
          hasData: !!file.data,
          dataLength: file.data?.length || 0
        })
      })
    }

    // Generate the image
    const startTime = Date.now()
    const result = await providerManager.generateImage(provider as ProviderType, generationOptions)
    const endTime = Date.now()

    if (!result.success) {
      throw new Error(result.error || 'Generation failed')
    }

    // Save generation to database (only in production)
    if (!isDevelopment) {
      const supabase = createServerClient()
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
        } as any)

      if (saveError) {
        console.error('Error saving generation:', saveError)
        // Don't fail the request if we can't save to DB
      }

      // Update API key last used timestamp
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() } as any)
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('is_active', true)

      if (updateError) {
        console.error('Error updating API key timestamp:', updateError)
      }
    } else {
      console.log('Development mode: skipping database save')
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      metadata: {
        ...result.metadata,
        generationTime: endTime - startTime
      }
    })

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
    } else if (error.message.includes('Prompt') || error.message.includes('não pôde gerar')) {
      errorMessage = error.message
      statusCode = 400
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}