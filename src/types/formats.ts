// Image Format Types and Enums
export enum ImageFormat {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  CLASSIC_PHOTO = '4:3',
  PORTRAIT_PHOTO = '3:4',
  ULTRAWIDE = '21:9',
  VERTICAL_PHOTO = '2:3',
  HORIZONTAL_PHOTO = '3:2',
}

export enum FormatCategory {
  SOCIAL_MEDIA = 'social-media',
  PRINT = 'print',
  WEB = 'web',
  MOBILE = 'mobile',
}

export interface FormatDimensions {
  width: number
  height: number
  aspectRatio: string
  megapixels: number
}

export interface FormatInfo {
  id: string
  name: string
  description: string
  aspectRatio: string
  category: FormatCategory
  dimensions: FormatDimensions
  icon: string
  useCases: string[]
  platforms?: string[]
  isPopular?: boolean
}

// Predefined format configurations
export const FORMAT_PRESETS: Record<string, FormatInfo> = {
  'instagram-square': {
    id: 'instagram-square',
    name: 'Instagram Post',
    description: 'Formato quadrado perfeito para posts do Instagram',
    aspectRatio: '1:1',
    category: FormatCategory.SOCIAL_MEDIA,
    dimensions: {
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      megapixels: 1.17
    },
    icon: '🔲',
    useCases: ['Instagram Post', 'Facebook Post', 'Twitter Post'],
    platforms: ['Instagram', 'Facebook', 'Twitter'],
    isPopular: true
  },
  
  'instagram-story': {
    id: 'instagram-story',
    name: 'Instagram Stories',
    description: 'Formato vertical para Stories e Reels',
    aspectRatio: '9:16',
    category: FormatCategory.SOCIAL_MEDIA,
    dimensions: {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      megapixels: 2.07
    },
    icon: '📱',
    useCases: ['Instagram Stories', 'TikTok', 'YouTube Shorts'],
    platforms: ['Instagram', 'TikTok', 'YouTube', 'Snapchat'],
    isPopular: true
  },
  
  'youtube-thumbnail': {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    description: 'Miniatura otimizada para vídeos do YouTube',
    aspectRatio: '16:9',
    category: FormatCategory.WEB,
    dimensions: {
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      megapixels: 2.07
    },
    icon: '🎬',
    useCases: ['YouTube Thumbnail', 'Vimeo Thumbnail', 'Video Preview'],
    platforms: ['YouTube', 'Vimeo'],
    isPopular: true
  },
  
  'facebook-cover': {
    id: 'facebook-cover',
    name: 'Facebook Capa',
    description: 'Imagem de capa para páginas do Facebook',
    aspectRatio: '21:9',
    category: FormatCategory.SOCIAL_MEDIA,
    dimensions: {
      width: 1920,
      height: 820,
      aspectRatio: '21:9',
      megapixels: 1.57
    },
    icon: '🏞️',
    useCases: ['Facebook Cover', 'LinkedIn Banner', 'Twitter Header'],
    platforms: ['Facebook', 'LinkedIn', 'Twitter'],
    isPopular: false
  },
  
  'print-photo': {
    id: 'print-photo',
    name: 'Foto Impressão',
    description: 'Formato clássico para impressão de fotos',
    aspectRatio: '4:3',
    category: FormatCategory.PRINT,
    dimensions: {
      width: 1024,
      height: 768,
      aspectRatio: '4:3',
      megapixels: 0.79
    },
    icon: '🖼️',
    useCases: ['Impressão', 'Álbum de Fotos', 'Quadros'],
    platforms: [],
    isPopular: false
  },
  
  'portrait-print': {
    id: 'portrait-print',
    name: 'Retrato Impressão',
    description: 'Formato vertical para retratos e impressão',
    aspectRatio: '3:4',
    category: FormatCategory.PRINT,
    dimensions: {
      width: 768,
      height: 1024,
      aspectRatio: '3:4',
      megapixels: 0.79
    },
    icon: '👤',
    useCases: ['Retratos', 'Impressão Vertical', 'Quadros Verticais'],
    platforms: [],
    isPopular: false
  },
  
  'pinterest-pin': {
    id: 'pinterest-pin',
    name: 'Pinterest Pin',
    description: 'Formato vertical otimizado para Pinterest',
    aspectRatio: '2:3',
    category: FormatCategory.SOCIAL_MEDIA,
    dimensions: {
      width: 1000,
      height: 1500,
      aspectRatio: '2:3',
      megapixels: 1.5
    },
    icon: '📌',
    useCases: ['Pinterest Pin', 'Infográfico', 'Blog Post Image'],
    platforms: ['Pinterest'],
    isPopular: true
  },
  
  'web-banner': {
    id: 'web-banner',
    name: 'Banner Web',
    description: 'Banner horizontal para sites e blogs',
    aspectRatio: '3:2',
    category: FormatCategory.WEB,
    dimensions: {
      width: 1536,
      height: 1024,
      aspectRatio: '3:2',
      megapixels: 1.57
    },
    icon: '🌐',
    useCases: ['Banner de Site', 'Header de Blog', 'Imagem de Artigo'],
    platforms: [],
    isPopular: false
  },
}

// Helper functions to get formats (computed on demand, not at module load)
export function getPopularFormats(): FormatInfo[] {
  return Object.values(FORMAT_PRESETS).filter(format => format.isPopular)
}

export function getFormatsByCategory(category: FormatCategory): FormatInfo[] {
  return Object.values(FORMAT_PRESETS).filter(f => f.category === category)
}

export function getAllFormatsByCategory(): Record<FormatCategory, FormatInfo[]> {
  return {
    [FormatCategory.SOCIAL_MEDIA]: getFormatsByCategory(FormatCategory.SOCIAL_MEDIA),
    [FormatCategory.PRINT]: getFormatsByCategory(FormatCategory.PRINT),
    [FormatCategory.WEB]: getFormatsByCategory(FormatCategory.WEB),
    [FormatCategory.MOBILE]: getFormatsByCategory(FormatCategory.MOBILE),
  }
}

// Backward compatibility - but these are now computed lazily
export const POPULAR_FORMATS = getPopularFormats()
export const FORMATS_BY_CATEGORY = getAllFormatsByCategory()

// Helper functions
export function getFormatById(id: string): FormatInfo | undefined {
  return FORMAT_PRESETS[id]
}

export function getFormatByAspectRatio(aspectRatio: string): FormatInfo[] {
  return Object.values(FORMAT_PRESETS).filter(format => format.aspectRatio === aspectRatio)
}

export function getDimensionsFromAspectRatio(aspectRatio: string, maxWidth: number = 1920): FormatDimensions {
  // Prevent infinite recursion and invalid values
  if (!aspectRatio || typeof aspectRatio !== 'string' || maxWidth <= 0) {
    return {
      width: 1024,
      height: 1024,
      aspectRatio: '1:1',
      megapixels: 1.05
    }
  }

  const ratios: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1, height: 1 },
    '16:9': { width: 16, height: 9 },
    '9:16': { width: 9, height: 16 },
    '4:3': { width: 4, height: 3 },
    '3:4': { width: 3, height: 4 },
    '21:9': { width: 21, height: 9 },
    '2:3': { width: 2, height: 3 },
    '3:2': { width: 3, height: 2 },
  }

  const ratio = ratios[aspectRatio] || ratios['1:1']
  
  // Ensure ratio values are valid
  if (!ratio || ratio.width <= 0 || ratio.height <= 0) {
    return {
      width: 1024,
      height: 1024,
      aspectRatio: '1:1',
      megapixels: 1.05
    }
  }
  
  // Calculate dimensions maintaining aspect ratio
  let width = Math.min(maxWidth, 1920) // Cap maximum width
  let height = Math.round((width * ratio.height) / ratio.width)
  
  // If height exceeds reasonable limit, scale down
  if (height > maxWidth) {
    height = Math.min(maxWidth, 1920) // Cap maximum height
    width = Math.round((height * ratio.width) / ratio.height)
  }

  // Ensure minimum dimensions
  width = Math.max(256, width)
  height = Math.max(256, height)

  return {
    width,
    height,
    aspectRatio,
    megapixels: Math.round((width * height) / 1000000 * 100) / 100
  }
}

export interface FormatSelection {
  selectedFormats: string[] // Array of format IDs
  batchGeneration: boolean  // Generate for all selected formats
}

export interface FormatGenerationOptions {
  format: FormatInfo
  customDimensions?: {
    width: number
    height: number
  }
  resizeStrategy?: 'crop' | 'pad' | 'stretch'
  backgroundColor?: string // For padding
}