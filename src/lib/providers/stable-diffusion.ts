import { 
  AIProvider, 
  GenerationOptions, 
  GenerationResult, 
  CostEstimate, 
  ProviderInfo 
} from './types'

export class StableDiffusionProvider extends AIProvider {
  private baseUrl: string

  constructor(apiKey: string, baseUrl = 'https://api.replicate.com/v1') {
    super(apiKey)
    this.baseUrl = baseUrl
  }

  async generateImage(options: GenerationOptions): Promise<GenerationResult> {
    try {
      this.validateOptions(options)
      
      const startTime = Date.now()
      
      // Parse dimensions
      const dimensions = options.aspectRatio 
        ? this.parseAspectRatio(options.aspectRatio)
        : { width: options.width || 1024, height: options.height || 1024 }

      // Prepare the input for Stable Diffusion via Replicate
      const input = {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt || '',
        width: dimensions.width,
        height: dimensions.height,
        num_inference_steps: options.steps || 50,
        guidance_scale: options.guidance || 7.5,
        seed: options.seed,
        scheduler: 'DPMSolverMultistep',
        num_outputs: 1
      }

      // Start prediction
      const prediction = await this.createPrediction(options.model || 'stable-diffusion-xl', input)
      
      // Wait for completion
      const result = await this.waitForPrediction(prediction.id)
      
      const generationTime = Date.now() - startTime

      if (result.status === 'succeeded' && result.output && result.output.length > 0) {
        return {
          success: true,
          imageUrl: result.output[0],
          metadata: {
            model: options.model || 'stable-diffusion-xl',
            seed: options.seed,
            steps: options.steps || 50,
            guidance: options.guidance || 7.5,
            generationTime,
            cost: this.estimateCost(options).credits
          }
        }
      } else {
        throw new Error(result.error || 'Generation failed')
      }
    } catch (error: any) {
      console.error('Stable Diffusion generation error:', error)
      return {
        success: false,
        error: error.message || 'Image generation failed'
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch (error) {
      console.error('Stable Diffusion API key validation failed:', error)
      return false
    }
  }

  estimateCost(options: GenerationOptions): CostEstimate {
    // Replicate pricing for Stable Diffusion (approximate)
    const baseCostPerSecond = 0.0023 // $0.0023 per second
    
    // Estimate generation time based on steps and resolution
    const steps = options.steps || 50
    const dimensions = options.aspectRatio 
      ? this.parseAspectRatio(options.aspectRatio)
      : { width: options.width || 1024, height: options.height || 1024 }
    
    const pixels = dimensions.width * dimensions.height
    const baseTime = 10 // Base time in seconds
    
    // More steps = more time
    const stepMultiplier = steps / 20
    
    // Higher resolution = more time
    const resolutionMultiplier = pixels / (512 * 512)
    
    const estimatedSeconds = baseTime * stepMultiplier * resolutionMultiplier
    const finalCost = baseCostPerSecond * estimatedSeconds

    return {
      credits: Math.ceil(finalCost * 100),
      usdCost: finalCost,
      description: `~${estimatedSeconds.toFixed(1)}s × $${baseCostPerSecond}/s = $${finalCost.toFixed(4)}`
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      id: 'stable-diffusion',
      name: 'Stable Diffusion',
      description: 'Open-source diffusion model for high-quality image generation',
      website: 'https://stability.ai',
      documentation: 'https://replicate.com/stability-ai/stable-diffusion',
      keyFormat: 'r8_...',
      capabilities: {
        maxWidth: 2048,
        maxHeight: 2048,
        supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2'],
        supportedStyles: [
          'photorealistic',
          'artistic',
          'anime',
          'digital art',
          'oil painting',
          'watercolor',
          'sketch',
          'cartoon',
          '3D render',
          'cyberpunk',
          'fantasy'
        ],
        supportsNegativePrompts: true,
        supportsSteps: true,
        supportsGuidance: true,
        supportsSeed: true,
        maxPromptLength: 1000
      },
      models: [
        'stable-diffusion-xl',
        'stable-diffusion-2-1',
        'stable-diffusion-1-5'
      ],
      defaultModel: 'stable-diffusion-xl'
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      // Return known Stable Diffusion models available on Replicate
      return [
        'stable-diffusion-xl',
        'stable-diffusion-2-1',
        'stable-diffusion-1-5'
      ]
    } catch (error) {
      console.error('Error fetching Stable Diffusion models:', error)
      return ['stable-diffusion-xl']
    }
  }

  private async createPrediction(model: string, input: any): Promise<any> {
    const modelUrls: Record<string, string> = {
      'stable-diffusion-xl': 'stability-ai/sdxl',
      'stable-diffusion-2-1': 'stability-ai/stable-diffusion',
      'stable-diffusion-1-5': 'runwayml/stable-diffusion-v1-5'
    }

    const modelUrl = modelUrls[model] || modelUrls['stable-diffusion-xl']

    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: modelUrl,
        input
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create prediction: ${error}`)
    }

    return await response.json()
  }

  private async waitForPrediction(predictionId: string): Promise<any> {
    const maxAttempts = 60 // 5 minutes maximum
    const pollInterval = 5000 // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch prediction status')
      }

      const prediction = await response.json()

      if (prediction.status === 'succeeded' || prediction.status === 'failed') {
        return prediction
      }

      // Wait before next poll
      await this.sleep(pollInterval)
    }

    throw new Error('Prediction timed out')
  }
}