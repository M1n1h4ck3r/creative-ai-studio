// Updated interface to support multiple provider types
export interface ProviderInterface {
  name: string
  id: string
  type: 'text' | 'image' | 'both'

  // Core methods
  validateKey(): Promise<boolean>
  estimateCost(prompt: string, options: any): Promise<number>
  
  // Generation methods
  generateText?(prompt: string, options?: any): Promise<any>
  generateImage?(prompt: string, options?: any): Promise<any>
  
  // Information methods
  getAvailableModels(): any[]
  getCapabilities(): {
    text: boolean
    image: boolean
    chat: boolean
    streaming: boolean
    functionCalling: boolean
    vision: boolean
    maxContextLength: number
    supportedLanguages: string[]
    features: string[]
  }
}

// Update the provider types interface
export interface ProviderTypes {
  text: ProviderInterface[]
  image: ProviderInterface[]  
  both: ProviderInterface[]
}