export interface GenerationOptions {
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  aspectRatio?: string
  style?: string
  quality?: 'standard' | 'hd'
  steps?: number
  guidance?: number
  seed?: number
  model?: string
}

export interface GenerationResult {
  success: boolean
  imageUrl?: string
  imageData?: string // Raw base64 data without data URL prefix
  error?: string
  metadata?: {
    model: string
    seed?: number
    steps?: number
    guidance?: number
    generationTime: number
    cost?: number
    textResponse?: string // For multimodal responses that include text
  }
}

export interface CostEstimate {
  credits: number
  usdCost: number
  description: string
}

export interface ProviderCapabilities {
  maxWidth: number
  maxHeight: number
  supportedAspectRatios: string[]
  supportedStyles: string[]
  supportsNegativePrompts: boolean
  supportsSteps: boolean
  supportsGuidance: boolean
  supportsSeed: boolean
  maxPromptLength: number
  supportsImageEditing?: boolean // Support for image-to-image editing
  supportsMultiTurn?: boolean // Support for conversational editing
  supportsTextInImages?: boolean // Support for rendering text in images
}

export interface ProviderInfo {
  id: string
  name: string
  description: string
  website: string
  documentation: string
  keyFormat: string
  capabilities: ProviderCapabilities
  models: string[]
  defaultModel: string
}

export abstract class AIProvider {
  protected apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Abstract methods that each provider must implement
  abstract generateImage(options: GenerationOptions): Promise<GenerationResult>
  abstract validateApiKey(): Promise<boolean>
  abstract estimateCost(options: GenerationOptions): CostEstimate
  abstract getProviderInfo(): ProviderInfo
  abstract getAvailableModels(): Promise<string[]>

  // Common utility methods
  protected validateOptions(options: GenerationOptions): void {
    if (!options.prompt?.trim()) {
      throw new Error('Prompt is required')
    }

    const info = this.getProviderInfo()
    
    if (options.prompt.length > info.capabilities.maxPromptLength) {
      throw new Error(`Prompt too long. Maximum ${info.capabilities.maxPromptLength} characters`)
    }

    if (options.width && options.width > info.capabilities.maxWidth) {
      throw new Error(`Width too large. Maximum ${info.capabilities.maxWidth}px`)
    }

    if (options.height && options.height > info.capabilities.maxHeight) {
      throw new Error(`Height too large. Maximum ${info.capabilities.maxHeight}px`)
    }
  }

  protected parseAspectRatio(aspectRatio: string): { width: number; height: number } {
    const ratios: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '4:3': { width: 1024, height: 768 },
      '3:4': { width: 768, height: 1024 },
      '21:9': { width: 1920, height: 820 },
      '2:3': { width: 1024, height: 1536 },
      '3:2': { width: 1536, height: 1024 },
    }

    return ratios[aspectRatio] || ratios['1:1']
  }

  // Rate limiting helpers
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export type ProviderType = 'gemini' | 'openai' | 'replicate' | 'stable-diffusion'

export interface ProviderConfig {
  type: ProviderType
  apiKey: string
  model?: string
  options?: Record<string, any>
}