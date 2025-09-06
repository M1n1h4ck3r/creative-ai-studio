// Advanced template system for Creative AI Studio
export interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  type: 'image' | 'text' | 'both'
  tags: string[]
  prompt: string
  negativePrompt?: string
  settings: TemplateSettings
  preview?: string
  author: string
  isPublic: boolean
  usageCount: number
  rating: number
  createdAt: string
  updatedAt: string
}

export interface TemplateSettings {
  provider?: string
  model?: string
  aspectRatio?: string
  style?: string
  quality?: 'standard' | 'hd'
  steps?: number
  guidance?: number
  seed?: number
  temperature?: number
  maxTokens?: number
  variables?: TemplateVariable[]
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'select' | 'boolean'
  label: string
  description?: string
  required: boolean
  defaultValue?: any
  options?: string[] // For select type
  min?: number // For number type
  max?: number // For number type
}

export type TemplateCategory = 
  | 'marketing'
  | 'social-media'
  | 'art'
  | 'photography'
  | 'business'
  | 'education'
  | 'entertainment'
  | 'logos'
  | 'portraits'
  | 'landscapes'
  | 'abstract'
  | 'writing'
  | 'coding'
  | 'custom'

export interface TemplateCollection {
  id: string
  name: string
  description: string
  templates: string[] // Template IDs
  author: string
  isPublic: boolean
  createdAt: string
}

// Built-in templates
export const BUILTIN_TEMPLATES: Template[] = [
  // Marketing Templates
  {
    id: 'marketing-product-hero',
    name: 'Hero de Produto',
    description: 'Imagem hero profissional para produtos',
    category: 'marketing',
    type: 'image',
    tags: ['produto', 'hero', 'marketing', 'profissional'],
    prompt: 'Professional product photography of {{product}}, clean white background, studio lighting, high quality, commercial grade, {{style}} style, detailed, crisp focus',
    negativePrompt: 'blurry, low quality, dark, shadows, cluttered background',
    settings: {
      aspectRatio: '16:9',
      quality: 'hd',
      steps: 30,
      guidance: 7,
      variables: [
        {
          name: 'product',
          type: 'text',
          label: 'Produto',
          description: 'Descreva o produto a ser fotografado',
          required: true,
          defaultValue: 'smartphone elegante'
        },
        {
          name: 'style',
          type: 'select',
          label: 'Estilo',
          required: false,
          defaultValue: 'minimalist',
          options: ['minimalist', 'luxury', 'tech', 'organic', 'bold']
        }
      ]
    },
    author: 'system',
    isPublic: true,
    usageCount: 0,
    rating: 4.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Social Media Templates
  {
    id: 'social-instagram-post',
    name: 'Post Instagram',
    description: 'Post otimizado para Instagram com engagement',
    category: 'social-media',
    type: 'image',
    tags: ['instagram', 'social', 'post', 'quadrado'],
    prompt: 'Instagram-worthy {{theme}} post, vibrant colors, trendy {{aesthetic}} aesthetic, eye-catching composition, perfect for social media, high engagement potential',
    settings: {
      aspectRatio: '1:1',
      quality: 'hd',
      variables: [
        {
          name: 'theme',
          type: 'text',
          label: 'Tema',
          required: true,
          defaultValue: 'lifestyle'
        },
        {
          name: 'aesthetic',
          type: 'select',
          label: 'Estética',
          required: false,
          defaultValue: 'modern',
          options: ['modern', 'vintage', 'boho', 'minimalist', 'colorful']
        }
      ]
    },
    author: 'system',
    isPublic: true,
    usageCount: 0,
    rating: 4.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Art Templates
  {
    id: 'art-digital-painting',
    name: 'Pintura Digital',
    description: 'Artwork estilo pintura digital profissional',
    category: 'art',
    type: 'image',
    tags: ['arte', 'pintura', 'digital', 'artístico'],
    prompt: 'Digital painting of {{subject}}, {{art_style}} art style, masterpiece quality, detailed brushwork, rich colors, artistic composition, museum worthy',
    negativePrompt: 'photograph, realistic, low quality, amateur',
    settings: {
      aspectRatio: '3:4',
      steps: 40,
      guidance: 8,
      variables: [
        {
          name: 'subject',
          type: 'text',
          label: 'Assunto',
          required: true,
          defaultValue: 'paisagem montanhosa ao pôr do sol'
        },
        {
          name: 'art_style',
          type: 'select',
          label: 'Estilo Artístico',
          required: false,
          defaultValue: 'impressionist',
          options: ['impressionist', 'expressionist', 'surreal', 'abstract', 'romantic', 'baroque']
        }
      ]
    },
    author: 'system',
    isPublic: true,
    usageCount: 0,
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Logo Templates
  {
    id: 'logo-modern-minimalist',
    name: 'Logo Minimalista',
    description: 'Logo moderno e minimalista para empresas',
    category: 'logos',
    type: 'image',
    tags: ['logo', 'minimalista', 'moderno', 'empresa'],
    prompt: 'Modern minimalist logo design for {{company_name}}, {{industry}} industry, clean lines, professional, scalable, {{color_scheme}} color scheme, white background',
    negativePrompt: 'complex, cluttered, outdated, low quality',
    settings: {
      aspectRatio: '1:1',
      quality: 'hd',
      variables: [
        {
          name: 'company_name',
          type: 'text',
          label: 'Nome da Empresa',
          required: true,
          defaultValue: 'TechCorp'
        },
        {
          name: 'industry',
          type: 'select',
          label: 'Setor',
          required: false,
          defaultValue: 'technology',
          options: ['technology', 'finance', 'healthcare', 'education', 'retail', 'consulting']
        },
        {
          name: 'color_scheme',
          type: 'select',
          label: 'Esquema de Cores',
          required: false,
          defaultValue: 'blue and white',
          options: ['blue and white', 'black and white', 'green and white', 'purple and white', 'monochrome']
        }
      ]
    },
    author: 'system',
    isPublic: true,
    usageCount: 0,
    rating: 4.6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Writing Templates
  {
    id: 'writing-blog-post',
    name: 'Post de Blog',
    description: 'Estrutura completa para post de blog otimizado',
    category: 'writing',
    type: 'text',
    tags: ['blog', 'post', 'seo', 'conteúdo'],
    prompt: 'Write a comprehensive blog post about {{topic}}. Include:\n\n1. Compelling headline\n2. Introduction that hooks the reader\n3. {{sections}} main sections with subheadings\n4. Practical tips and examples\n5. Conclusion with call-to-action\n\nTarget audience: {{audience}}\nTone: {{tone}}\nWord count: approximately {{word_count}} words\n\nMake it SEO-friendly and engaging.',
    settings: {
      temperature: 0.7,
      maxTokens: 2000,
      variables: [
        {
          name: 'topic',
          type: 'text',
          label: 'Tópico',
          required: true,
          defaultValue: 'produtividade no trabalho remoto'
        },
        {
          name: 'sections',
          type: 'number',
          label: 'Número de seções',
          required: false,
          defaultValue: 5,
          min: 3,
          max: 10
        },
        {
          name: 'audience',
          type: 'select',
          label: 'Público-alvo',
          required: false,
          defaultValue: 'professionals',
          options: ['professionals', 'students', 'entrepreneurs', 'general audience']
        },
        {
          name: 'tone',
          type: 'select',
          label: 'Tom',
          required: false,
          defaultValue: 'professional',
          options: ['professional', 'casual', 'authoritative', 'friendly', 'humorous']
        },
        {
          name: 'word_count',
          type: 'number',
          label: 'Número de palavras',
          required: false,
          defaultValue: 1500,
          min: 500,
          max: 5000
        }
      ]
    },
    author: 'system',
    isPublic: true,
    usageCount: 0,
    rating: 4.4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Template processing functions
export class TemplateEngine {
  static processTemplate(template: Template, variables: Record<string, any>): string {
    let processedPrompt = template.prompt

    // Replace variables in the prompt
    template.settings.variables?.forEach(variable => {
      const value = variables[variable.name] ?? variable.defaultValue ?? ''
      const regex = new RegExp(`{{${variable.name}}}`, 'g')
      processedPrompt = processedPrompt.replace(regex, value.toString())
    })

    // Remove any remaining unprocessed variables
    processedPrompt = processedPrompt.replace(/{{[^}]+}}/g, '')

    return processedPrompt.trim()
  }

  static validateVariables(template: Template, variables: Record<string, any>): string[] {
    const errors: string[] = []

    template.settings.variables?.forEach(variable => {
      const value = variables[variable.name]

      if (variable.required && (!value || value === '')) {
        errors.push(`${variable.label} é obrigatório`)
        return
      }

      if (!value) return // Skip validation for optional empty values

      // Type validation
      switch (variable.type) {
        case 'number':
          const numValue = Number(value)
          if (isNaN(numValue)) {
            errors.push(`${variable.label} deve ser um número`)
          } else {
            if (variable.min !== undefined && numValue < variable.min) {
              errors.push(`${variable.label} deve ser pelo menos ${variable.min}`)
            }
            if (variable.max !== undefined && numValue > variable.max) {
              errors.push(`${variable.label} deve ser no máximo ${variable.max}`)
            }
          }
          break
        
        case 'select':
          if (variable.options && !variable.options.includes(value)) {
            errors.push(`${variable.label} deve ser uma das opções válidas`)
          }
          break
      }
    })

    return errors
  }

  static getTemplatesByCategory(category: TemplateCategory): Template[] {
    return BUILTIN_TEMPLATES.filter(template => template.category === category)
  }

  static searchTemplates(query: string, category?: TemplateCategory): Template[] {
    let templates = BUILTIN_TEMPLATES

    if (category) {
      templates = templates.filter(template => template.category === category)
    }

    if (!query) return templates

    const lowerQuery = query.toLowerCase()
    
    return templates.filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.prompt.toLowerCase().includes(lowerQuery)
    )
  }

  static getPopularTemplates(limit: number = 10): Template[] {
    return BUILTIN_TEMPLATES
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  static getTopRatedTemplates(limit: number = 10): Template[] {
    return BUILTIN_TEMPLATES
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
  }
}

// Template categories with descriptions
export const TEMPLATE_CATEGORIES: Array<{
  id: TemplateCategory
  name: string
  description: string
  icon: string
}> = [
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Templates para campanhas e materiais promocionais',
    icon: '📢'
  },
  {
    id: 'social-media',
    name: 'Redes Sociais',
    description: 'Posts otimizados para plataformas sociais',
    icon: '📱'
  },
  {
    id: 'art',
    name: 'Arte',
    description: 'Criações artísticas e expressões visuais',
    icon: '🎨'
  },
  {
    id: 'photography',
    name: 'Fotografia',
    description: 'Estilos e composições fotográficas',
    icon: '📸'
  },
  {
    id: 'business',
    name: 'Negócios',
    description: 'Materiais corporativos e profissionais',
    icon: '💼'
  },
  {
    id: 'education',
    name: 'Educação',
    description: 'Conteúdo educacional e didático',
    icon: '🎓'
  },
  {
    id: 'entertainment',
    name: 'Entretenimento',
    description: 'Conteúdo divertido e criativo',
    icon: '🎭'
  },
  {
    id: 'logos',
    name: 'Logos',
    description: 'Identidades visuais e marcas',
    icon: '🏷️'
  },
  {
    id: 'portraits',
    name: 'Retratos',
    description: 'Portraits e fotografias de pessoas',
    icon: '👤'
  },
  {
    id: 'landscapes',
    name: 'Paisagens',
    description: 'Cenários naturais e urbanos',
    icon: '🏞️'
  },
  {
    id: 'abstract',
    name: 'Abstrato',
    description: 'Arte conceitual e experimental',
    icon: '🌀'
  },
  {
    id: 'writing',
    name: 'Escrita',
    description: 'Templates para produção de texto',
    icon: '✍️'
  },
  {
    id: 'coding',
    name: 'Programação',
    description: 'Geração e documentação de código',
    icon: '💻'
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Templates criados pelo usuário',
    icon: '⚙️'
  }
]