import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  AIProvider,
  GenerationOptions,
  GenerationResult,
  CostEstimate,
  ProviderInfo,
  ProviderCapabilities
} from './types'
import { FORMAT_PRESETS, getDimensionsFromAspectRatio } from '@/types/formats'

export class GeminiProvider extends AIProvider {
  private genAI: GoogleGenerativeAI

  constructor(apiKey: string) {
    super(apiKey)
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async generateImage(options: GenerationOptions): Promise<GenerationResult> {
    try {
      this.validateOptions(options)

      const startTime = Date.now()

      // Prepare generation config with advanced controls
      const generationConfig: any = {}

      if (options.geminiConfig) {
        const config = options.geminiConfig
        if (config.temperature !== undefined) generationConfig.temperature = config.temperature
        if (config.topP !== undefined) generationConfig.topP = config.topP
        if (config.topK !== undefined) generationConfig.topK = config.topK
        if (config.maxOutputTokens !== undefined) generationConfig.maxOutputTokens = config.maxOutputTokens
        if (config.candidateCount !== undefined) generationConfig.candidateCount = config.candidateCount
        if (config.presencePenalty !== undefined) generationConfig.presencePenalty = config.presencePenalty
        if (config.frequencyPenalty !== undefined) generationConfig.frequencyPenalty = config.frequencyPenalty
        if (config.stopSequences && config.stopSequences.length > 0) generationConfig.stopSequences = config.stopSequences
        if (config.seed !== undefined) generationConfig.seed = config.seed
        if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType
      }

      // Try different models in case of issues
      let modelName = options.model || 'gemini-3.0-pro-image-preview'

      // Fallback models if the primary doesn't work
      const fallbackModels = [
        'gemini-3.0-pro-image-preview',
        'gemini-2.5-flash-image-preview',
        'imagen-3.0-generate-001',
        'imagen-3.0-fast-generate-001',
        'gemini-2.0-flash'
      ]

      let model
      let modelUsed = modelName

      try {
        model = this.genAI.getGenerativeModel({ model: modelName })
        console.log('Gemini Debug - Using model:', modelName)
      } catch (modelError) {
        console.warn('Model creation failed for', modelName, '- trying fallbacks')

        for (const fallback of fallbackModels) {
          try {
            model = this.genAI.getGenerativeModel({ model: fallback })
            modelUsed = fallback
            console.log('Gemini Debug - Using fallback model:', fallback)
            break
          } catch (fallbackError) {
            console.warn('Fallback model failed:', fallback, fallbackError)
          }
        }

        if (!model) {
          throw new Error('All Gemini models failed to initialize')
        }
      }

      // Process format information
      let dimensions = { width: 1024, height: 1024 } // Default square
      let aspectRatioInfo = ''

      if (options.format && FORMAT_PRESETS[options.format]) {
        const format = FORMAT_PRESETS[options.format]
        dimensions = {
          width: format.dimensions.width,
          height: format.dimensions.height
        }
        aspectRatioInfo = `Format: ${format.name} (${format.aspectRatio}), optimized for: ${format.useCases.join(', ')}. `
      } else if (options.aspectRatio) {
        const formatDimensions = getDimensionsFromAspectRatio(options.aspectRatio)
        dimensions = {
          width: formatDimensions.width,
          height: formatDimensions.height
        }
        aspectRatioInfo = `Aspect ratio: ${options.aspectRatio}. `
      } else if (options.width && options.height) {
        dimensions = {
          width: options.width,
          height: options.height
        }
        const ratio = Math.round((options.width / options.height) * 100) / 100
        aspectRatioInfo = `Custom dimensions: ${options.width}×${options.height} (ratio: ${ratio}). `
      }

      // Build the enhanced prompt with format, style and negative prompts
      let enhancedPrompt = options.prompt

      // Add format context to the prompt
      if (aspectRatioInfo) {
        enhancedPrompt = `${aspectRatioInfo}${enhancedPrompt}`
      }

      // If there are attached files, modify the prompt to be clear about image generation
      if (options.attachedFiles && options.attachedFiles.length > 0) {
        enhancedPrompt = `Generate a new image based on the following prompt: "${enhancedPrompt}". Use the attached image(s) as visual reference or inspiration. Create a completely new image following the description.`
      }

      if (options.style) {
        enhancedPrompt += `, ${options.style} style`
      }

      if (options.negativePrompt) {
        enhancedPrompt += `. Avoid: ${options.negativePrompt}`
      }

      console.log('Gemini Debug - Enhanced prompt:', enhancedPrompt)
      console.log('Gemini Debug - Model being used:', options.model || 'gemini-2.5-flash-image-preview')

      // Simplify content for debugging - just use the prompt
      const contents = [enhancedPrompt]

      console.log('Gemini Debug - Contents array:', contents)

      // Generate image using Gemini's native capabilities
      console.log('Gemini Debug - About to call generateContent...')
      const result = await model.generateContent(contents)
      console.log('Gemini Debug - generateContent result:', result)

      if (!result.response) {
        throw new Error('No response from Gemini model')
      }

      const response = result.response
      const candidates = response.candidates

      if (!candidates || candidates.length === 0) {
        throw new Error('No image candidates generated')
      }

      // Extract image data from the response
      let imageUrl: string | undefined
      let imageData: string | undefined

      for (const candidate of candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            // Convert base64 data to data URL
            const mimeType = part.inlineData.mimeType || 'image/png'
            imageData = part.inlineData.data
            imageUrl = `data:${mimeType};base64,${imageData}`
            break
          }
        }
        if (imageUrl) break
      }

      if (!imageUrl) {
        // Check if there's a text response explaining why no image was generated
        let textResponse = ''
        for (const candidate of candidates) {
          for (const part of candidate.content.parts) {
            if (part.text) {
              textResponse = part.text
              break
            }
          }
          if (textResponse) break
        }

        if (textResponse) {
          throw new Error(`Gemini não pôde gerar a imagem: ${textResponse}`)
        } else {
          throw new Error('No image data found in response')
        }
      }

      const generationTime = Date.now() - startTime

      return {
        success: true,
        imageUrl,
        imageData, // Include raw base64 data
        metadata: {
          model: modelUsed,
          seed: options.seed,
          steps: options.steps,
          guidance: options.guidance,
          generationTime,
          cost: 0,
          width: dimensions.width,
          height: dimensions.height,
          format: options.format,
          aspectRatio: options.aspectRatio || (options.format && FORMAT_PRESETS[options.format]?.aspectRatio)
        }
      }
    } catch (error: any) {
      console.error('Gemini generation error:', error)

      // More detailed error message based on the specific error
      let errorMessage = 'Image generation failed'

      if (error.message?.includes('Invalid argument')) {
        errorMessage = 'Invalid request format for Gemini API. The model may not be available or the request format is incorrect.'
      } else if (error.message?.includes('API_KEY')) {
        errorMessage = 'Invalid or missing Gemini API key. Please check your API key configuration.'
      } else if (error.message?.includes('quota')) {
        errorMessage = 'Gemini API quota exceeded. Please try again later.'
      } else if (error.message?.includes('model')) {
        errorMessage = 'Gemini image model not available. The service may be in preview or unavailable in your region.'
      } else {
        errorMessage = error.message || 'Image generation failed'
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent('Hello')
      return !!result.response
    } catch (error) {
      console.error('Gemini API key validation failed:', error)
      return false
    }
  }

  estimateCost(options: GenerationOptions): CostEstimate {
    // No cost limits - free generation
    return {
      credits: 0,
      usdCost: 0,
      description: 'Free generation - no cost'
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      id: 'gemini',
      name: 'Google Gemini 2.5 Flash Image',
      description: 'Google\'s multimodal AI with native image generation and conversational editing capabilities',
      website: 'https://ai.google.dev',
      documentation: 'https://ai.google.dev/gemini-api/docs/image-generation',
      keyFormat: 'AIzaSy...',
      capabilities: {
        maxWidth: 1920,
        maxHeight: 1920,
        supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '2:3', '3:2'],
        supportedStyles: [
          'photorealistic',
          'artistic',
          'cartoon',
          'abstract',
          'minimalist',
          'kawaii-style',
          'studio-lit',
          'film noir',
          'impressionism',
          'anime'
        ],
        supportsNegativePrompts: true,
        supportsSteps: false,
        supportsGuidance: false,
        supportsSeed: false,
        maxPromptLength: 8000,
        supportsImageEditing: true,
        supportsMultiTurn: true,
        supportsTextInImages: true
      },
      models: ['gemini-3.0-pro-image-preview', 'gemini-2.5-flash-image-preview'],
      defaultModel: 'gemini-3.0-pro-image-preview'
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // Return available Gemini image generation models
      return ['gemini-3.0-pro-image-preview', 'gemini-2.5-flash-image-preview']
    } catch (error) {
      console.error('Error fetching Gemini models:', error)
      return ['gemini-2.5-flash-image-preview']
    }
  }

  // Method for image editing with existing images
  async editImage(
    prompt: string,
    inputImage: string | File,
    options?: Partial<GenerationOptions>
  ): Promise<GenerationResult> {
    try {
      const startTime = Date.now()

      const model = this.genAI.getGenerativeModel({
        model: options?.model || 'gemini-2.5-flash-image-preview'
      })

      let imageData: string

      // Handle different input types
      if (typeof inputImage === 'string') {
        // If it's a data URL, extract the base64 part
        if (inputImage.startsWith('data:')) {
          imageData = inputImage.split(',')[1]
        } else {
          imageData = inputImage
        }
      } else {
        // Convert File to base64
        imageData = await this.fileToBase64(inputImage)
      }

      // Create the image part for the prompt
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg' // Adjust based on actual image type
        }
      }

      // Generate edited image
      const result = await model.generateContent([prompt, imagePart])

      if (!result.response) {
        throw new Error('No response from Gemini model')
      }

      const response = result.response
      const candidates = response.candidates

      if (!candidates || candidates.length === 0) {
        throw new Error('No image candidates generated')
      }

      // Extract image data from the response
      let imageUrl: string | undefined
      let outputImageData: string | undefined

      for (const candidate of candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png'
            outputImageData = part.inlineData.data
            imageUrl = `data:${mimeType};base64,${outputImageData}`
            break
          }
        }
        if (imageUrl) break
      }

      if (!imageUrl) {
        throw new Error('No image data found in response')
      }

      const generationTime = Date.now() - startTime

      return {
        success: true,
        imageUrl,
        imageData: outputImageData,
        metadata: {
          model: options?.model || 'gemini-2.5-flash-image-preview',
          generationTime,
          cost: 0
        }
      }
    } catch (error: any) {
      console.error('Gemini image editing error:', error)
      return {
        success: false,
        error: error.message || 'Image editing failed'
      }
    }
  }

  // Multi-turn conversational image editing
  async conversationalEdit(
    conversation: Array<{
      type: 'text' | 'image'
      content: string
      imageData?: string
    }>,
    options?: Partial<GenerationOptions>
  ): Promise<GenerationResult> {
    try {
      const startTime = Date.now()

      const model = this.genAI.getGenerativeModel({
        model: options?.model || 'gemini-2.5-flash-image-preview'
      })

      // Build content array for multi-turn conversation
      const contents: any[] = []

      for (const turn of conversation) {
        if (turn.type === 'text') {
          contents.push(turn.content)
        } else if (turn.type === 'image' && turn.imageData) {
          const imagePart = {
            inlineData: {
              data: turn.imageData,
              mimeType: 'image/jpeg'
            }
          }
          contents.push(imagePart)
        }
      }

      // Generate response
      const result = await model.generateContent(contents)

      if (!result.response) {
        throw new Error('No response from Gemini model')
      }

      const response = result.response
      const candidates = response.candidates

      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates generated')
      }

      // Extract image or text response
      let imageUrl: string | undefined
      let imageData: string | undefined
      let textResponse: string | undefined

      for (const candidate of candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/png'
            imageData = part.inlineData.data
            imageUrl = `data:${mimeType};base64,${imageData}`
          } else if (part.text) {
            textResponse = part.text
          }
        }
      }

      const generationTime = Date.now() - startTime

      return {
        success: true,
        imageUrl,
        imageData,
        metadata: {
          model: options?.model || 'gemini-2.5-flash-image-preview',
          generationTime,
          cost: 0,
          textResponse
        }
      }
    } catch (error: any) {
      console.error('Gemini conversational editing error:', error)
      return {
        success: false,
        error: error.message || 'Conversational editing failed'
      }
    }
  }

  // Batch generation for multiple formats
  async generateMultipleFormats(
    baseOptions: GenerationOptions,
    formatIds: string[]
  ): Promise<Array<GenerationResult & { formatId: string; formatInfo?: any }>> {
    const results: Array<GenerationResult & { formatId: string; formatInfo?: any }> = []

    for (const formatId of formatIds) {
      try {
        const formatOptions = {
          ...baseOptions,
          format: formatId
        }

        const result = await this.generateImage(formatOptions)
        results.push({
          ...result,
          formatId,
          formatInfo: FORMAT_PRESETS[formatId]
        })

        // Add small delay between requests to avoid rate limiting
        await this.sleep(500)
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message || 'Generation failed',
          formatId,
          formatInfo: FORMAT_PRESETS[formatId]
        })
      }
    }

    return results
  }

  // Helper method to convert File to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}