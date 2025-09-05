import { ProviderInterface, GenerationOptions, GenerationResult } from './types'

export class StabilityProvider implements ProviderInterface {
  name = 'Stability AI'
  id = 'stability'
  type = 'image' as const
  
  private apiKey: string
  private baseURL = 'https://api.stability.ai/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async validateKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/user/account`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Stability AI key validation error:', error)
      return false
    }
  }

  async estimateCost(prompt: string, options: GenerationOptions): Promise<number> {
    // Stability AI pricing varies by model and resolution
    const engine = options.model || 'stable-diffusion-v1-6'
    const steps = options.steps || 30
    
    // Approximate costs (may vary)
    const baseCost = 0.002 // $0.002 per image for SDXL
    const stepMultiplier = steps / 30 // base 30 steps
    
    return baseCost * stepMultiplier
  }

  async generateText(): Promise<GenerationResult> {
    return {
      success: false,
      error: 'Stability AI does not support text generation'
    }
  }

  async generateImage(prompt: string, options: GenerationOptions = {}): Promise<GenerationResult> {
    try {
      const engine = options.model || 'stable-diffusion-xl-1024-v1-0'
      const width = options.width || 1024
      const height = options.height || 1024
      const steps = options.steps || 30
      const guidanceScale = options.guidanceScale || 7
      const samples = options.samples || 1

      const body = {
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: guidanceScale,
        height,
        width,
        samples,
        steps,
        style_preset: options.stylePreset || 'none',
      }

      // Add negative prompt if provided
      if (options.negativePrompt) {
        body.text_prompts.push({
          text: options.negativePrompt,
          weight: -1
        })
      }

      const response = await fetch(`${this.baseURL}/generation/${engine}/text-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Stability AI API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.artifacts || data.artifacts.length === 0) {
        throw new Error('No images generated')
      }

      // Return first image as base64 data URL
      const imageBase64 = data.artifacts[0].base64
      const imageUrl = `data:image/png;base64,${imageBase64}`

      return {
        success: true,
        imageUrl,
        content: imageUrl,
        model: engine,
        metadata: {
          width,
          height,
          steps,
          guidance_scale: guidanceScale,
          seed: data.artifacts[0].seed,
          finish_reason: data.artifacts[0].finishReason
        }
      }
    } catch (error) {
      console.error('Stability AI generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed'
      }
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'stable-diffusion-xl-1024-v1-0',
        name: 'SDXL 1.0',
        description: 'High-resolution image generation up to 1024x1024',
        resolution: '1024x1024',
        category: 'General'
      },
      {
        id: 'stable-diffusion-v1-6',
        name: 'Stable Diffusion v1.6',
        description: 'Classic Stable Diffusion model',
        resolution: '512x512',
        category: 'General'
      },
      {
        id: 'stable-diffusion-xl-beta-v2-2-2',
        name: 'SDXL Beta',
        description: 'Beta version of SDXL with experimental features',
        resolution: '1024x1024',
        category: 'Experimental'
      },
      {
        id: 'stable-diffusion-512-v2-1',
        name: 'SD v2.1',
        description: 'Improved version with better prompt following',
        resolution: '512x512',
        category: 'General'
      },
      {
        id: 'stable-diffusion-768-v2-1',
        name: 'SD v2.1 (768)',
        description: 'Higher resolution variant of SD v2.1',
        resolution: '768x768',
        category: 'General'
      }
    ]
  }

  getCapabilities() {
    return {
      text: false,
      image: true,
      chat: false,
      streaming: false,
      functionCalling: false,
      vision: false,
      maxContextLength: 0,
      supportedLanguages: ['en'],
      features: [
        'High-quality image generation',
        'Multiple style presets',
        'Adjustable guidance scale',
        'Custom dimensions',
        'Negative prompts',
        'Seed control for reproducibility',
        'Batch generation',
        'Various artistic styles'
      ]
    }
  }

  // Specialized methods for Stability AI

  async imageToImage(
    initImage: string, 
    prompt: string, 
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    try {
      const engine = options.model || 'stable-diffusion-xl-1024-v1-0'
      const strength = options.strength || 0.35 // How much to transform the image
      
      const formData = new FormData()
      
      // Convert base64 to blob if needed
      let imageBlob: Blob
      if (initImage.startsWith('data:')) {
        const base64Data = initImage.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        imageBlob = new Blob([byteArray], { type: 'image/png' })
      } else {
        const response = await fetch(initImage)
        imageBlob = await response.blob()
      }

      formData.append('init_image', imageBlob)
      formData.append('text_prompts[0][text]', prompt)
      formData.append('text_prompts[0][weight]', '1')
      formData.append('cfg_scale', (options.guidanceScale || 7).toString())
      formData.append('image_strength', strength.toString())
      formData.append('steps', (options.steps || 30).toString())
      formData.append('samples', (options.samples || 1).toString())

      if (options.negativePrompt) {
        formData.append('text_prompts[1][text]', options.negativePrompt)
        formData.append('text_prompts[1][weight]', '-1')
      }

      const response = await fetch(`${this.baseURL}/generation/${engine}/image-to-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Stability AI API error: ${response.status}`)
      }

      const data = await response.json()
      const imageBase64 = data.artifacts[0].base64
      const imageUrl = `data:image/png;base64,${imageBase64}`

      return {
        success: true,
        imageUrl,
        content: imageUrl,
        model: engine,
        metadata: {
          strength,
          seed: data.artifacts[0].seed,
          finish_reason: data.artifacts[0].finishReason
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image-to-image failed'
      }
    }
  }

  async upscaleImage(image: string, options: GenerationOptions = {}): Promise<GenerationResult> {
    try {
      const width = options.width || 2048
      const height = options.height || 2048

      let imageBlob: Blob
      if (image.startsWith('data:')) {
        const base64Data = image.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        imageBlob = new Blob([byteArray], { type: 'image/png' })
      } else {
        const response = await fetch(image)
        imageBlob = await response.blob()
      }

      const formData = new FormData()
      formData.append('image', imageBlob)
      formData.append('width', width.toString())
      formData.append('height', height.toString())

      const response = await fetch(`${this.baseURL}/generation/esrgan-v1-x2plus/image-to-image/upscale`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Stability AI API error: ${response.status}`)
      }

      const data = await response.json()
      const imageBase64 = data.artifacts[0].base64
      const imageUrl = `data:image/png;base64,${imageBase64}`

      return {
        success: true,
        imageUrl,
        content: imageUrl,
        model: 'esrgan-v1-x2plus',
        metadata: { width, height }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image upscaling failed'
      }
    }
  }

  // Get available style presets
  getStylePresets() {
    return [
      { id: 'none', name: 'None', description: 'No style applied' },
      { id: 'enhance', name: 'Enhance', description: 'Enhance the prompt' },
      { id: 'anime', name: 'Anime', description: 'Anime style' },
      { id: 'photographic', name: 'Photographic', description: 'Photorealistic style' },
      { id: 'digital-art', name: 'Digital Art', description: 'Digital art style' },
      { id: 'comic-book', name: 'Comic Book', description: 'Comic book style' },
      { id: 'fantasy-art', name: 'Fantasy Art', description: 'Fantasy art style' },
      { id: 'line-art', name: 'Line Art', description: 'Line art style' },
      { id: 'analog-film', name: 'Analog Film', description: 'Analog film style' },
      { id: 'neon-punk', name: 'Neon Punk', description: 'Neon punk style' },
      { id: 'isometric', name: 'Isometric', description: 'Isometric style' },
      { id: 'low-poly', name: 'Low Poly', description: 'Low poly 3D style' },
      { id: 'origami', name: 'Origami', description: 'Origami paper art style' },
      { id: 'modeling-compound', name: 'Modeling Compound', description: 'Clay/modeling style' },
      { id: 'cinematic', name: 'Cinematic', description: 'Movie-like style' },
      { id: '3d-model', name: '3D Model', description: '3D rendered style' }
    ]
  }

  // Get account information
  async getAccountInfo() {
    try {
      const response = await fetch(`${this.baseURL}/user/account`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch account info')
      }

      return await response.json()
    } catch (error) {
      console.error('Account info fetch error:', error)
      return null
    }
  }

  // Get account balance
  async getAccountBalance() {
    try {
      const response = await fetch(`${this.baseURL}/user/balance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch account balance')
      }

      return await response.json()
    } catch (error) {
      console.error('Account balance fetch error:', error)
      return null
    }
  }
}