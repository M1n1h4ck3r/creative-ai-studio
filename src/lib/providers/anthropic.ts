import { ProviderInterface, GenerationOptions, GenerationResult } from './types'

export class AnthropicProvider implements ProviderInterface {
  name = 'Anthropic Claude'
  id = 'anthropic'
  type = 'text' as const
  
  private apiKey: string
  private baseURL = 'https://api.anthropic.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async validateKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }]
        })
      })

      return response.status === 200 || response.status === 400 // 400 means key is valid but request malformed
    } catch (error) {
      console.error('Anthropic key validation error:', error)
      return false
    }
  }

  async estimateCost(prompt: string, options: GenerationOptions): Promise<number> {
    // Claude pricing (approximate)
    const inputTokens = Math.ceil(prompt.length / 4) // rough estimate
    const outputTokens = options.maxLength || 1000
    
    // Claude-3 Haiku: $0.25/$1.25 per 1M tokens (input/output)
    // Claude-3 Sonnet: $3/$15 per 1M tokens
    // Claude-3 Opus: $15/$75 per 1M tokens
    
    const model = options.model || 'claude-3-haiku-20240307'
    
    let inputCost = 0
    let outputCost = 0
    
    if (model.includes('haiku')) {
      inputCost = (inputTokens / 1000000) * 0.25
      outputCost = (outputTokens / 1000000) * 1.25
    } else if (model.includes('sonnet')) {
      inputCost = (inputTokens / 1000000) * 3
      outputCost = (outputTokens / 1000000) * 15
    } else if (model.includes('opus')) {
      inputCost = (inputTokens / 1000000) * 15
      outputCost = (outputTokens / 1000000) * 75
    }
    
    return inputCost + outputCost
  }

  async generateText(prompt: string, options: GenerationOptions = {}): Promise<GenerationResult> {
    try {
      const model = options.model || 'claude-3-haiku-20240307'
      const maxTokens = options.maxLength || 1000
      const temperature = options.temperature || 0.7

      const messages = [
        {
          role: 'user' as const,
          content: prompt
        }
      ]

      // Add system message if provided
      const requestBody: any = {
        model,
        max_tokens: maxTokens,
        messages,
        temperature,
      }

      if (options.systemPrompt) {
        requestBody.system = options.systemPrompt
      }

      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `Anthropic API error: ${response.status}`)
      }

      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Anthropic API')
      }

      return {
        success: true,
        content: data.content[0].text,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        model: data.model,
        finishReason: data.stop_reason
      }
    } catch (error) {
      console.error('Anthropic generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async generateImage(): Promise<GenerationResult> {
    return {
      success: false,
      error: 'Anthropic Claude does not support image generation'
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fast and cost-effective model for simple tasks',
        maxTokens: 200000,
        pricing: { input: 0.25, output: 1.25 } // per 1M tokens
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed for complex tasks',
        maxTokens: 200000,
        pricing: { input: 3, output: 15 }
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most powerful model for highly complex tasks',
        maxTokens: 200000,
        pricing: { input: 15, output: 75 }
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Latest and most capable model with enhanced reasoning',
        maxTokens: 200000,
        pricing: { input: 3, output: 15 }
      }
    ]
  }

  getCapabilities() {
    return {
      text: true,
      image: false,
      chat: true,
      streaming: true,
      functionCalling: false,
      vision: true, // Claude 3 supports image analysis
      maxContextLength: 200000,
      supportedLanguages: ['pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh'],
      features: [
        'Long context understanding',
        'Code generation and analysis',
        'Mathematical reasoning',
        'Image analysis and description',
        'Multilingual capabilities',
        'Creative writing',
        'Research assistance'
      ]
    }
  }

  // Specific Claude methods
  async analyzeImage(imageUrl: string, prompt: string): Promise<GenerationResult> {
    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageUrl // Should be base64 encoded
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `Anthropic API error: ${response.status}`)
      }

      return {
        success: true,
        content: data.content[0].text,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        model: data.model
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image analysis failed'
      }
    }
  }

  // Generate creative prompts for images
  async generateImagePrompt(description: string): Promise<GenerationResult> {
    const systemPrompt = `Você é um especialista em criação de prompts para geração de imagens com IA. 
    Transforme a descrição do usuário em um prompt detalhado e criativo que produzirá imagens de alta qualidade.
    
    Inclua:
    - Estilo artístico adequado
    - Detalhes visuais específicos
    - Iluminação e composição
    - Qualidade e resolução
    
    Mantenha o prompt em inglês e seja específico mas conciso.`

    return await this.generateText(
      `Crie um prompt detalhado para gerar uma imagem baseada nesta descrição: "${description}"`,
      { 
        systemPrompt,
        maxLength: 300,
        temperature: 0.8
      }
    )
  }
}