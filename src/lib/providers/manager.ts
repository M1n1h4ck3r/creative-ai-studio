import { 
  AIProvider, 
  ProviderType, 
  ProviderConfig, 
  GenerationOptions, 
  GenerationResult,
  CostEstimate,
  ProviderInfo 
} from './types'
import { GeminiProvider } from './gemini'
import { OpenAIProvider } from './openai'
import { StableDiffusionProvider } from './stable-diffusion'
import { decrypt } from '../encryption'

export class ProviderManager {
  private providers: Map<ProviderType, AIProvider> = new Map()
  private apiKeys: Map<ProviderType, string> = new Map()

  constructor() {
    // Initialize with empty providers
  }

  // Initialize providers with encrypted API keys from database
  async initializeProviders(encryptedApiKeys: Array<{ provider: ProviderType; encrypted_key: string }>) {
    this.providers.clear()
    this.apiKeys.clear()

    for (const keyData of encryptedApiKeys) {
      try {
        const decryptedKey = decrypt(keyData.encrypted_key)
        this.apiKeys.set(keyData.provider, decryptedKey)
        
        const provider = this.createProvider(keyData.provider, decryptedKey)
        if (provider) {
          this.providers.set(keyData.provider, provider)
        }
      } catch (error) {
        console.error(`Failed to initialize provider ${keyData.provider}:`, error)
      }
    }
  }

  // Create a provider instance
  private createProvider(type: ProviderType, apiKey: string): AIProvider | null {
    switch (type) {
      case 'gemini':
        return new GeminiProvider(apiKey)
      case 'openai':
        return new OpenAIProvider(apiKey)
      case 'replicate':
      case 'stable-diffusion':
        return new StableDiffusionProvider(apiKey)
      default:
        console.warn(`Unknown provider type: ${type}`)
        return null
    }
  }

  // Add or update a provider
  async addProvider(config: ProviderConfig): Promise<boolean> {
    try {
      const provider = this.createProvider(config.type, config.apiKey)
      if (!provider) {
        throw new Error(`Unsupported provider type: ${config.type}`)
      }

      // Validate the API key
      const isValid = await provider.validateApiKey()
      if (!isValid) {
        throw new Error('Invalid API key')
      }

      this.providers.set(config.type, provider)
      this.apiKeys.set(config.type, config.apiKey)
      
      return true
    } catch (error) {
      console.error(`Failed to add provider ${config.type}:`, error)
      return false
    }
  }

  // Remove a provider
  removeProvider(type: ProviderType): boolean {
    const removed = this.providers.delete(type) && this.apiKeys.delete(type)
    return removed
  }

  // Get a specific provider
  getProvider(type: ProviderType): AIProvider | null {
    return this.providers.get(type) || null
  }

  // Check if a provider is available
  hasProvider(type: ProviderType): boolean {
    return this.providers.has(type)
  }

  // Get all available provider types
  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys())
  }

  // Get provider info for all available providers
  getAllProviderInfo(): Array<{ type: ProviderType; info: ProviderInfo }> {
    const result: Array<{ type: ProviderType; info: ProviderInfo }> = []
    
    for (const [type, provider] of this.providers.entries()) {
      result.push({
        type,
        info: provider.getProviderInfo()
      })
    }
    
    return result
  }

  // Generate image using a specific provider
  async generateImage(providerType: ProviderType, options: GenerationOptions): Promise<GenerationResult> {
    const provider = this.getProvider(providerType)
    
    if (!provider) {
      return {
        success: false,
        error: `Provider ${providerType} is not available. Please configure the API key first.`
      }
    }

    try {
      const result = await provider.generateImage(options)
      return result
    } catch (error: any) {
      console.error(`Generation failed with ${providerType}:`, error)
      return {
        success: false,
        error: error.message || 'Image generation failed'
      }
    }
  }

  // Get cost estimate from a specific provider
  estimateCost(providerType: ProviderType, options: GenerationOptions): CostEstimate | null {
    const provider = this.getProvider(providerType)
    
    if (!provider) {
      return null
    }

    return provider.estimateCost(options)
  }

  // Get cost estimates from all available providers
  getAllCostEstimates(options: GenerationOptions): Array<{ provider: ProviderType; estimate: CostEstimate }> {
    const estimates: Array<{ provider: ProviderType; estimate: CostEstimate }> = []
    
    for (const [type, provider] of this.providers.entries()) {
      try {
        const estimate = provider.estimateCost(options)
        estimates.push({ provider: type, estimate })
      } catch (error) {
        console.error(`Failed to estimate cost for ${type}:`, error)
      }
    }
    
    // Sort by cost (lowest first)
    return estimates.sort((a, b) => a.estimate.usdCost - b.estimate.usdCost)
  }

  // Find the most cost-effective provider for given options
  getCheapestProvider(options: GenerationOptions): { provider: ProviderType; estimate: CostEstimate } | null {
    const estimates = this.getAllCostEstimates(options)
    return estimates.length > 0 ? estimates[0] : null
  }

  // Validate all providers
  async validateAllProviders(): Promise<Array<{ provider: ProviderType; valid: boolean; error?: string }>> {
    const validationResults: Array<{ provider: ProviderType; valid: boolean; error?: string }> = []
    
    for (const [type, provider] of this.providers.entries()) {
      try {
        const valid = await provider.validateApiKey()
        validationResults.push({ provider: type, valid })
      } catch (error: any) {
        validationResults.push({ 
          provider: type, 
          valid: false, 
          error: error.message || 'Validation failed' 
        })
      }
    }
    
    return validationResults
  }

  // Get available models for a specific provider
  async getAvailableModels(providerType: ProviderType): Promise<string[]> {
    const provider = this.getProvider(providerType)
    
    if (!provider) {
      return []
    }

    try {
      return await provider.getAvailableModels()
    } catch (error) {
      console.error(`Failed to get models for ${providerType}:`, error)
      return []
    }
  }

  // Smart provider selection based on prompt and requirements
  suggestProvider(options: GenerationOptions): ProviderType | null {
    const availableProviders = this.getAvailableProviders()
    
    if (availableProviders.length === 0) {
      return null
    }

    // Simple heuristics for provider selection
    const prompt = options.prompt.toLowerCase()
    
    // If prompt mentions photorealistic or photography, prefer OpenAI
    if (prompt.includes('photo') || prompt.includes('realistic') || prompt.includes('portrait')) {
      if (availableProviders.includes('openai')) {
        return 'openai'
      }
    }
    
    // If prompt mentions artistic styles, prefer Stable Diffusion
    if (prompt.includes('art') || prompt.includes('painting') || prompt.includes('drawing')) {
      if (availableProviders.includes('stable-diffusion')) {
        return 'stable-diffusion'
      }
    }
    
    // For general purpose, prefer Gemini if available
    if (availableProviders.includes('gemini')) {
      return 'gemini'
    }
    
    // Fall back to first available provider
    return availableProviders[0]
  }

  // Get provider statistics
  getProviderStats(): Array<{ provider: ProviderType; info: ProviderInfo; hasApiKey: boolean }> {
    const allProviderTypes: ProviderType[] = ['gemini', 'openai', 'replicate', 'stable-diffusion']
    
    return allProviderTypes.map(type => {
      const provider = this.getProvider(type)
      const hasApiKey = this.hasProvider(type)
      
      // Create temporary provider to get info even without API key
      let info: ProviderInfo
      try {
        if (provider) {
          info = provider.getProviderInfo()
        } else {
          // Create temporary provider just to get info
          const tempProvider = this.createProvider(type, 'dummy-key')
          info = tempProvider?.getProviderInfo() || {} as ProviderInfo
        }
      } catch (error) {
        info = {} as ProviderInfo
      }
      
      return { provider: type, info, hasApiKey }
    })
  }
}

// Singleton instance
let providerManagerInstance: ProviderManager | null = null

export function getProviderManager(): ProviderManager {
  if (!providerManagerInstance) {
    providerManagerInstance = new ProviderManager()
  }
  return providerManagerInstance
}

export default ProviderManager