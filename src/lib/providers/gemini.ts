import { GoogleGenerativeAI } from '@google/generative-ai'
import { 
  AIProvider, 
  GenerationOptions, 
  GenerationResult, 
  CostEstimate, 
  ProviderInfo,
  ProviderCapabilities 
} from './types'

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
      
      // Use Gemini 2.5 Flash Image model for native image generation
      const model = this.genAI.getGenerativeModel({ 
        model: options.model || 'gemini-2.5-flash-image-preview',
        generationConfig: Object.keys(generationConfig).length > 0 ? generationConfig : undefined
      })

      // Build the enhanced prompt with style and negative prompts
      let enhancedPrompt = options.prompt
      
      if (options.style) {
        enhancedPrompt += `, ${options.style} style`
      }
      
      if (options.negativePrompt) {
        enhancedPrompt += `. Avoid: ${options.negativePrompt}`
      }

      // Prepare content array (prompt + attached files)
      const contents: any[] = [enhancedPrompt]
      
      // Add attached files if provided
      if (options.attachedFiles && options.attachedFiles.length > 0) {
        for (const file of options.attachedFiles) {
          contents.push({
            inlineData: {
              data: file.data,
              mimeType: file.type
            }
          })
        }
      }

      // Generate image using Gemini's native capabilities
      const result = await model.generateContent(contents)
      
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
        throw new Error('No image data found in response')
      }
      
      const generationTime = Date.now() - startTime

      return {
        success: true,
        imageUrl,
        imageData, // Include raw base64 data
        metadata: {
          model: options.model || 'gemini-2.5-flash-image-preview',
          seed: options.seed,
          steps: options.steps,
          guidance: options.guidance,
          generationTime,
          cost: 0
        }
      }
    } catch (error: any) {
      console.error('Gemini generation error:', error)
      return {
        success: false,
        error: error.message || 'Image generation failed'
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
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
        maxWidth: 1024,
        maxHeight: 1024,
        supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
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
      models: ['gemini-2.5-flash-image-preview'],
      defaultModel: 'gemini-2.5-flash-image-preview'
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // Return available Gemini image generation models
      return ['gemini-2.5-flash-image-preview']
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