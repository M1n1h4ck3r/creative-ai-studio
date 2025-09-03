import OpenAI from 'openai'
import { 
  AIProvider, 
  GenerationOptions, 
  GenerationResult, 
  CostEstimate, 
  ProviderInfo 
} from './types'

export class OpenAIProvider extends AIProvider {
  private openai: OpenAI

  constructor(apiKey: string) {
    super(apiKey)
    this.openai = new OpenAI({ apiKey })
  }

  async generateImage(options: GenerationOptions): Promise<GenerationResult> {
    try {
      this.validateOptions(options)
      
      const startTime = Date.now()
      
      // Parse dimensions
      const dimensions = options.aspectRatio 
        ? this.parseAspectRatio(options.aspectRatio)
        : { width: options.width || 1024, height: options.height || 1024 }

      // OpenAI DALL-E 3 supports specific sizes
      const size = this.getClosestSupportedSize(dimensions)
      
      // Build enhanced prompt
      let enhancedPrompt = options.prompt
      
      if (options.style) {
        enhancedPrompt += `, in ${options.style} style`
      }

      const response = await this.openai.images.generate({
        model: options.model || 'dall-e-3',
        prompt: enhancedPrompt,
        size: size as '1024x1024' | '1792x1024' | '1024x1792',
        quality: options.quality || 'standard',
        n: 1,
        response_format: 'url'
      })

      const generationTime = Date.now() - startTime
      const imageUrl = response.data[0]?.url

      if (!imageUrl) {
        throw new Error('No image URL returned from OpenAI')
      }

      return {
        success: true,
        imageUrl,
        metadata: {
          model: options.model || 'dall-e-3',
          generationTime,
          cost: this.estimateCost(options).credits
        }
      }
    } catch (error: any) {
      console.error('OpenAI generation error:', error)
      return {
        success: false,
        error: error.message || 'Image generation failed'
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const models = await this.openai.models.list()
      return !!models.data
    } catch (error) {
      console.error('OpenAI API key validation failed:', error)
      return false
    }
  }

  estimateCost(options: GenerationOptions): CostEstimate {
    const model = options.model || 'dall-e-3'
    
    // DALL-E 3 pricing (as of 2024)
    const pricing: Record<string, { standard: number; hd: number }> = {
      'dall-e-3': {
        standard: 0.04, // $0.04 per image (1024×1024)
        hd: 0.08       // $0.08 per image (HD quality)
      },
      'dall-e-2': {
        standard: 0.02, // $0.02 per image
        hd: 0.02       // DALL-E 2 doesn't have HD pricing
      }
    }

    const modelPricing = pricing[model] || pricing['dall-e-3']
    const qualityMultiplier = options.quality === 'hd' ? 'hd' : 'standard'
    
    // Size multiplier for DALL-E 3
    const dimensions = options.aspectRatio 
      ? this.parseAspectRatio(options.aspectRatio)
      : { width: options.width || 1024, height: options.height || 1024 }
    
    let sizeMultiplier = 1
    if (model === 'dall-e-3') {
      // DALL-E 3 charges more for larger images
      if (dimensions.width > 1024 || dimensions.height > 1024) {
        sizeMultiplier = 2
      }
    }

    const baseCost = modelPricing[qualityMultiplier]
    const finalCost = baseCost * sizeMultiplier

    return {
      credits: Math.ceil(finalCost * 100), // Convert to credits
      usdCost: finalCost,
      description: `${model} (${qualityMultiplier}): $${baseCost} × ${sizeMultiplier}x size = $${finalCost.toFixed(3)}`
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      id: 'openai',
      name: 'OpenAI DALL-E',
      description: 'OpenAI\'s DALL-E models for high-quality image generation',
      website: 'https://openai.com',
      documentation: 'https://platform.openai.com/docs/guides/images',
      keyFormat: 'sk-...',
      capabilities: {
        maxWidth: 1792,
        maxHeight: 1792,
        supportedAspectRatios: ['1:1', '16:9', '9:16'],
        supportedStyles: [
          'photorealistic', 
          'digital art', 
          'oil painting', 
          'watercolor', 
          '3D render',
          'cartoon',
          'sketch',
          'abstract'
        ],
        supportsNegativePrompts: false, // DALL-E doesn't support negative prompts directly
        supportsSteps: false,
        supportsGuidance: false,
        supportsSeed: false,
        maxPromptLength: 4000
      },
      models: ['dall-e-3', 'dall-e-2'],
      defaultModel: 'dall-e-3'
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const models = await this.openai.models.list()
      const imageModels = models.data
        .filter(model => model.id.includes('dall-e'))
        .map(model => model.id)
      
      return imageModels.length > 0 ? imageModels : ['dall-e-3', 'dall-e-2']
    } catch (error) {
      console.error('Error fetching OpenAI models:', error)
      return ['dall-e-3', 'dall-e-2']
    }
  }

  private getClosestSupportedSize(dimensions: { width: number; height: number }): string {
    // DALL-E 3 supported sizes
    const supportedSizes = [
      { size: '1024x1024', width: 1024, height: 1024 },
      { size: '1792x1024', width: 1792, height: 1024 },
      { size: '1024x1792', width: 1024, height: 1792 }
    ]

    // Find the closest supported size
    let closest = supportedSizes[0]
    let minDistance = Math.abs(dimensions.width - closest.width) + Math.abs(dimensions.height - closest.height)

    for (const supportedSize of supportedSizes) {
      const distance = Math.abs(dimensions.width - supportedSize.width) + Math.abs(dimensions.height - supportedSize.height)
      if (distance < minDistance) {
        minDistance = distance
        closest = supportedSize
      }
    }

    return closest.size
  }
}