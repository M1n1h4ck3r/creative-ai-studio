import { ProviderInterface, GenerationOptions, GenerationResult } from './types'
import { HfInference } from '@huggingface/inference'

export class HuggingFaceProvider implements ProviderInterface {
  name = 'Hugging Face'
  id = 'huggingface'
  type = 'both' as const
  
  private hf: HfInference
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.hf = new HfInference(apiKey)
  }

  async validateKey(): Promise<boolean> {
    try {
      // Test with a simple text generation model
      await this.hf.textGeneration({
        model: 'gpt2',
        inputs: 'Test',
        parameters: { max_new_tokens: 1 }
      })
      return true
    } catch (error) {
      console.error('HuggingFace key validation error:', error)
      return false
    }
  }

  async estimateCost(): Promise<number> {
    // HuggingFace Inference API is generally free for public models
    // Paid plans are for private models and enterprise features
    return 0
  }

  async generateText(prompt: string, options: GenerationOptions = {}): Promise<GenerationResult> {
    try {
      const model = options.model || 'microsoft/DialoGPT-large'
      const maxTokens = options.maxLength || 500
      const temperature = options.temperature || 0.7

      const response = await this.hf.textGeneration({
        model,
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature,
          do_sample: true,
          top_p: 0.9,
          repetition_penalty: 1.1
        }
      })

      return {
        success: true,
        content: response.generated_text || '',
        model,
        usage: {
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: Math.ceil((response.generated_text || '').length / 4),
          totalTokens: Math.ceil((prompt + (response.generated_text || '')).length / 4)
        }
      }
    } catch (error) {
      console.error('HuggingFace text generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text generation failed'
      }
    }
  }

  async generateImage(prompt: string, options: GenerationOptions = {}): Promise<GenerationResult> {
    try {
      const model = options.model || 'runwayml/stable-diffusion-v1-5'
      
      const response = await this.hf.textToImage({
        model,
        inputs: prompt,
        parameters: {
          width: options.width || 512,
          height: options.height || 512,
          num_inference_steps: options.steps || 50,
          guidance_scale: options.guidanceScale || 7.5,
          negative_prompt: options.negativePrompt
        }
      })

      // Convert blob to base64
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const imageUrl = `data:image/png;base64,${base64}`

      return {
        success: true,
        imageUrl,
        content: imageUrl,
        model,
        metadata: {
          width: options.width || 512,
          height: options.height || 512,
          steps: options.steps || 50,
          guidance_scale: options.guidanceScale || 7.5
        }
      }
    } catch (error) {
      console.error('HuggingFace image generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed'
      }
    }
  }

  getAvailableModels() {
    return {
      text: [
        {
          id: 'microsoft/DialoGPT-large',
          name: 'DialoGPT Large',
          description: 'Conversational AI model for dialogue generation',
          maxTokens: 1024
        },
        {
          id: 'google/flan-t5-large',
          name: 'FLAN-T5 Large',
          description: 'Instruction-tuned text-to-text model',
          maxTokens: 512
        },
        {
          id: 'facebook/blenderbot-400M-distill',
          name: 'BlenderBot 400M',
          description: 'Open-domain chatbot model',
          maxTokens: 512
        },
        {
          id: 'huggingface/CodeBERTa-small-v1',
          name: 'CodeBERTa Small',
          description: 'Code generation and completion model',
          maxTokens: 512
        }
      ],
      image: [
        {
          id: 'runwayml/stable-diffusion-v1-5',
          name: 'Stable Diffusion v1.5',
          description: 'High-quality image generation from text',
          resolution: '512x512'
        },
        {
          id: 'stabilityai/stable-diffusion-2-1',
          name: 'Stable Diffusion v2.1',
          description: 'Improved version with better quality',
          resolution: '768x768'
        },
        {
          id: 'kandinsky-community/kandinsky-2-1',
          name: 'Kandinsky 2.1',
          description: 'Multilingual text-to-image model',
          resolution: '512x512'
        },
        {
          id: 'stabilityai/stable-diffusion-xl-base-1.0',
          name: 'SDXL Base 1.0',
          description: 'Extra large model for high-resolution images',
          resolution: '1024x1024'
        }
      ]
    }
  }

  getCapabilities() {
    return {
      text: true,
      image: true,
      chat: true,
      streaming: false,
      functionCalling: false,
      vision: false,
      maxContextLength: 2048,
      supportedLanguages: ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh'],
      features: [
        'Open source models',
        'Free inference API',
        'Thousands of available models',
        'Custom model fine-tuning',
        'Community contributions',
        'Text and image generation',
        'Specialized models (code, chat, etc.)'
      ]
    }
  }

  // Specialized methods for HuggingFace

  async generateCode(prompt: string, language: string = 'python'): Promise<GenerationResult> {
    const codePrompt = `# ${language.toUpperCase()} Code\n# Task: ${prompt}\n\n`
    
    return await this.generateText(codePrompt, {
      model: 'Salesforce/codegen-350M-mono',
      maxLength: 200,
      temperature: 0.2
    })
  }

  async translateText(text: string, targetLang: string): Promise<GenerationResult> {
    try {
      const response = await this.hf.translation({
        model: `Helsinki-NLP/opus-mt-en-${targetLang}`,
        inputs: text
      })

      return {
        success: true,
        content: response.translation_text,
        model: `Helsinki-NLP/opus-mt-en-${targetLang}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      }
    }
  }

  async summarizeText(text: string): Promise<GenerationResult> {
    try {
      const response = await this.hf.summarization({
        model: 'facebook/bart-large-cnn',
        inputs: text,
        parameters: {
          max_length: 150,
          min_length: 30
        }
      })

      return {
        success: true,
        content: response.summary_text,
        model: 'facebook/bart-large-cnn'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Summarization failed'
      }
    }
  }

  async classifyText(text: string, labels: string[]): Promise<GenerationResult> {
    try {
      const response = await this.hf.zeroShotClassification({
        model: 'facebook/bart-large-mnli',
        inputs: text,
        parameters: { candidate_labels: labels }
      })

      return {
        success: true,
        content: JSON.stringify(response, null, 2),
        model: 'facebook/bart-large-mnli',
        metadata: {
          labels: response.labels,
          scores: response.scores
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Classification failed'
      }
    }
  }

  async questionAnswering(question: string, context: string): Promise<GenerationResult> {
    try {
      const response = await this.hf.questionAnswering({
        model: 'deepset/roberta-base-squad2',
        inputs: {
          question,
          context
        }
      })

      return {
        success: true,
        content: response.answer,
        model: 'deepset/roberta-base-squad2',
        metadata: {
          score: response.score,
          start: response.start,
          end: response.end
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Question answering failed'
      }
    }
  }

  // Image-to-text (caption generation)
  async captionImage(imageUrl: string): Promise<GenerationResult> {
    try {
      // Convert image URL to blob if needed
      let imageBlob: Blob

      if (imageUrl.startsWith('data:')) {
        // Base64 image
        const base64Data = imageUrl.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        imageBlob = new Blob([byteArray], { type: 'image/jpeg' })
      } else {
        // URL image
        const response = await fetch(imageUrl)
        imageBlob = await response.blob()
      }

      const response = await this.hf.imageToText({
        model: 'nlpconnect/vit-gpt2-image-captioning',
        data: imageBlob
      })

      return {
        success: true,
        content: response.generated_text,
        model: 'nlpconnect/vit-gpt2-image-captioning'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image captioning failed'
      }
    }
  }

  // Get model information
  async getModelInfo(modelId: string) {
    try {
      const response = await fetch(`https://huggingface.co/api/models/${modelId}`)
      const data = await response.json()
      
      return {
        name: data.modelId,
        author: data.author,
        downloads: data.downloads,
        likes: data.likes,
        pipeline_tag: data.pipeline_tag,
        tags: data.tags,
        library_name: data.library_name
      }
    } catch (error) {
      console.error('Model info fetch error:', error)
      return null
    }
  }
}