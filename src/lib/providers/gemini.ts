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

      // Reverting to Gemini 3.0 as requested, but using Webhook
      const modelName = options.model || 'gemini-3.0-pro-image-preview'

      // Prepare payload for N8N Webhook
      const webhookPayload = {
        prompt: options.prompt,
        negativePrompt: options.negativePrompt,
        aspectRatio: options.aspectRatio,
        width: options.width,
        height: options.height,
        style: options.style,
        model: modelName,
        geminiConfig: options.geminiConfig,
        attachedFiles: options.attachedFiles,
        timestamp: new Date().toISOString()
      }

      console.log('Sending request to N8N Webhook:', webhookPayload)

      // Call N8N Webhook
      const webhookUrl = 'https://n8n.futuretools.today/webhook/e9b9d53b-58b8-4d0c-9a13-0b2252f7deba'
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload)
      })

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('N8N Webhook response:', result)

      // Expecting N8N to return { imageUrl: "...", ... } or similar
      // Adjust based on actual N8N output. Assuming it returns standard generation result structure or just imageUrl.

      let imageUrl = result.imageUrl || result.output || result.data

      // Handle case where N8N returns base64 directly without data: prefix
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        imageUrl = `data:image/png;base64,${imageUrl}`
      }

      if (!imageUrl) {
        throw new Error('No image URL returned from Webhook')
      }

      const generationTime = Date.now() - startTime

      return {
        success: true,
        imageUrl,
        metadata: {
          model: modelName,
          generationTime,
          cost: 0,
          ...result.metadata
        }
      }

    } catch (error: any) {
      console.error('Gemini/N8N generation error:', error)
      return {
        success: false,
        error: error.message || 'Image generation failed via Webhook'
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
      models: ['gemini-3.0-pro-image-preview', 'gemini-2.0-flash-exp'],
      defaultModel: 'gemini-3.0-pro-image-preview'
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // Return available Gemini/Imagen image generation models
      return ['gemini-3.0-pro-image-preview', 'gemini-2.0-flash-exp']
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