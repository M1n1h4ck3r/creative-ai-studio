import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// ... imports

export async function POST(request: NextRequest) {
  console.log('Generate API called')
  try {
    // Skip auth in development when Supabase is not available
    const isDevelopment = process.env.NODE_ENV === 'development'
    let user: any = null

    if (!isDevelopment) {
      // Authenticate user in production using cookie-based session
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { session }, error: authError } = await supabase.auth.getSession()

      console.log('Auth check:', { hasSession: !!session, authError: !!authError })

      if (authError || !session?.user) {
        console.log('Auth failed:', authError?.message)
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      user = session.user
    } else {
      console.log('Development mode: skipping auth')
      user = { id: 'dev-user' } // Mock user for development
    }

    const body = await request.json()
    const { prompt, provider, aspectRatio, style, negativePrompt, model, geminiConfig, attachedFiles } = body

    // Validate and sanitize prompt
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt é obrigatório' },
        { status: 400 }
      )
    }

    const promptValidation = validatePrompt(prompt.trim())
    if (!promptValidation.valid) {
      return NextResponse.json(
        { success: false, error: 'Prompt inválido', details: promptValidation.errors },
        { status: 400 }
      )
    }

    // Validate provider
    const validProviders = ['gemini', 'openai', 'replicate', 'anthropic', 'huggingface']
    const sanitizedProvider = provider?.toLowerCase()?.trim()

    if (!sanitizedProvider || !validProviders.includes(sanitizedProvider)) {
      return NextResponse.json(
        { success: false, error: 'Provider inválido' },
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

      // Find the requested provider's API key
      const providerKey = apiKeys?.find((key: any) => key.provider === provider)

      if (providerKey) {
        try {
          // Decrypt the API key
          decryptedKey = decrypt(providerKey.encrypted_key)
        } catch (decryptError) {
          console.error('Decryption error:', decryptError)
          // Fallback to environment variable if decryption fails
          decryptedKey = getEnvApiKey(provider)
        }
      } else {
        // Fallback to environment variable if no key in database
        decryptedKey = getEnvApiKey(provider)
      }

      if (!decryptedKey) {
        return NextResponse.json(
          { success: false, error: `No API key found for ${provider}. Please configure it in settings or environment variables.` },
          { status: 400 }
        )
      }
    }

    // Initialize provider manager with the specific provider
    const providerManager = getProviderManager()
    await providerManager.addProvider({
      type: provider as ProviderType,
      apiKey: decryptedKey
    })

    // Prepare generation options with sanitized prompt
    const generationOptions: GenerationOptions = {
      prompt: promptValidation.sanitized,
      negativePrompt: negativePrompt || undefined,
      aspectRatio: aspectRatio || '1:1',
      style: style || undefined,
      model: model || undefined,
      geminiConfig: sanitizedProvider === 'gemini' ? geminiConfig : undefined,
      attachedFiles: sanitizedProvider === 'gemini' ? attachedFiles : undefined
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

    // Save generation to database (in both development and production)
    try {
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
        // Don't fail the request if we can't save to DB in development
        if (!isDevelopment) {
          throw saveError
        }
      } else {
        console.log('Generation saved to database successfully')
      }
    } catch (dbError) {
      console.error('Database save error:', dbError)
      // Don't fail the request in development if DB is not available
      if (!isDevelopment) {
        throw dbError
      }
    }

    // Update API key last used timestamp only in production
    if (!isDevelopment) {
      const supabase = createServerClient()
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

    // Use sanitized error message
    const sanitizedMessage = sanitizeErrorMessage(error)
    let statusCode = 500

    // Categorize error types for appropriate status codes
    if (error.message?.includes('Invalid API key') || error.message?.includes('unauthorized')) {
      statusCode = 401
    } else if (error.message?.includes('Rate limit') || error.message?.includes('quota')) {
      statusCode = 429
    } else if (error.message?.includes('Prompt') || error.message?.includes('validation') || error.message?.includes('inválido')) {
      statusCode = 400
    } else if (error.message?.includes('timeout') || error.message?.includes('network')) {
      statusCode = 503
    }

    return NextResponse.json(
      { success: false, error: sanitizedMessage },
      { status: statusCode }
    )
  }
}