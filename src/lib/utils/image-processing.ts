import { FormatInfo, FormatGenerationOptions } from '@/types/formats'

export interface ImageDimensions {
  width: number
  height: number
  aspectRatio: number
}

export interface ResizeOptions {
  strategy: 'crop' | 'pad' | 'stretch'
  backgroundColor?: string
  gravity?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

/**
 * Calculate aspect ratio from width and height
 */
export function calculateAspectRatio(width: number, height: number): number {
  return Math.round((width / height) * 100) / 100
}

/**
 * Parse aspect ratio string (e.g., "16:9") to decimal
 */
export function parseAspectRatio(aspectRatio: string): number {
  const [w, h] = aspectRatio.split(':').map(Number)
  return w / h
}

/**
 * Get dimensions that maintain aspect ratio within max bounds
 */
export function calculateDimensionsForAspectRatio(
  targetRatio: number,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): ImageDimensions {
  let width: number
  let height: number

  if (targetRatio > 1) {
    // Landscape
    width = Math.min(maxWidth, maxHeight * targetRatio)
    height = width / targetRatio
  } else {
    // Portrait or square
    height = Math.min(maxHeight, maxWidth / targetRatio)
    width = height * targetRatio
  }

  // Ensure dimensions are even numbers (some APIs require this)
  width = Math.floor(width / 2) * 2
  height = Math.floor(height / 2) * 2

  return {
    width: Math.max(256, width), // Minimum 256px
    height: Math.max(256, height), // Minimum 256px
    aspectRatio: width / height
  }
}

/**
 * Get optimal dimensions for a format
 */
export function getOptimalDimensions(format: FormatInfo, maxResolution: number = 1920): ImageDimensions {
  const targetRatio = parseAspectRatio(format.aspectRatio)
  
  // Use format's preferred dimensions if available and within limits
  if (format.dimensions.width <= maxResolution && format.dimensions.height <= maxResolution) {
    return {
      width: format.dimensions.width,
      height: format.dimensions.height,
      aspectRatio: format.dimensions.width / format.dimensions.height
    }
  }

  // Otherwise calculate optimal dimensions
  return calculateDimensionsForAspectRatio(targetRatio, maxResolution, maxResolution)
}

/**
 * Resize image data URL to new dimensions
 * Note: This is a client-side utility using Canvas API
 */
export async function resizeImageDataUrl(
  dataUrl: string,
  targetWidth: number,
  targetHeight: number,
  options: ResizeOptions = { strategy: 'crop', gravity: 'center' }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      canvas.width = targetWidth
      canvas.height = targetHeight

      const sourceRatio = img.width / img.height
      const targetRatio = targetWidth / targetHeight

      let sourceX = 0, sourceY = 0, sourceW = img.width, sourceH = img.height
      let destX = 0, destY = 0, destW = targetWidth, destH = targetHeight

      if (options.strategy === 'crop') {
        if (sourceRatio > targetRatio) {
          // Source is wider, crop horizontally
          sourceW = img.height * targetRatio
          sourceX = (img.width - sourceW) / 2
          
          // Adjust crop position based on gravity
          if (options.gravity?.includes('left')) sourceX = 0
          if (options.gravity?.includes('right')) sourceX = img.width - sourceW
        } else if (sourceRatio < targetRatio) {
          // Source is taller, crop vertically
          sourceH = img.width / targetRatio
          sourceY = (img.height - sourceH) / 2
          
          // Adjust crop position based on gravity
          if (options.gravity?.includes('top')) sourceY = 0
          if (options.gravity?.includes('bottom')) sourceY = img.height - sourceH
        }
      } else if (options.strategy === 'pad') {
        // Fill background color
        if (options.backgroundColor) {
          ctx.fillStyle = options.backgroundColor
          ctx.fillRect(0, 0, targetWidth, targetHeight)
        }

        if (sourceRatio > targetRatio) {
          // Source is wider, add padding top/bottom
          destH = targetWidth / sourceRatio
          destY = (targetHeight - destH) / 2
        } else if (sourceRatio < targetRatio) {
          // Source is taller, add padding left/right
          destW = targetHeight * sourceRatio
          destX = (targetWidth - destW) / 2
        }
      }
      // For 'stretch' strategy, we use default values (full canvas)

      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, destX, destY, destW, destH)
      
      // Convert to data URL
      try {
        const result = canvas.toDataURL('image/png', 0.95)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

/**
 * Convert image to different format
 */
export async function convertImageFormat(
  dataUrl: string,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality: number = 0.95
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      
      // For JPEG, fill background with white to avoid transparency issues
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      ctx.drawImage(img, 0, 0)
      
      try {
        const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`
        const result = canvas.toDataURL(mimeType, quality)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

/**
 * Get image dimensions from data URL
 */
export async function getImageDimensions(dataUrl: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      })
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

/**
 * Generate optimized versions for multiple formats
 */
export async function generateMultiFormatImages(
  originalDataUrl: string,
  formats: FormatInfo[],
  options: Partial<ResizeOptions> = {}
): Promise<Array<{ format: FormatInfo; dataUrl: string; dimensions: ImageDimensions }>> {
  const results = []
  
  for (const format of formats) {
    try {
      const dimensions = getOptimalDimensions(format)
      
      const resizedDataUrl = await resizeImageDataUrl(
        originalDataUrl,
        dimensions.width,
        dimensions.height,
        { strategy: 'crop', gravity: 'center', ...options }
      )
      
      results.push({
        format,
        dataUrl: resizedDataUrl,
        dimensions
      })
    } catch (error) {
      console.error(`Failed to resize image for format ${format.id}:`, error)
    }
  }
  
  return results
}

/**
 * Calculate file size estimate from data URL
 */
export function estimateFileSizeFromDataUrl(dataUrl: string): number {
  // Remove data URL prefix and calculate base64 size
  const base64Data = dataUrl.split(',')[1] || dataUrl
  const paddingLength = (base64Data.match(/=/g) || []).length
  const base64Length = base64Data.length - paddingLength
  
  // Base64 encoding increases size by ~33%, so actual size is ~75% of base64 length
  return Math.round(base64Length * 0.75)
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  
  return `${Math.round(size * 100) / 100} ${sizes[i]}`
}

/**
 * Validate image format compatibility
 */
export function validateFormatCompatibility(
  imageDimensions: ImageDimensions,
  targetFormat: FormatInfo,
  tolerance: number = 0.1
): {
  isCompatible: boolean
  recommendation?: string
  aspectRatioDifference: number
} {
  const targetRatio = parseAspectRatio(targetFormat.aspectRatio)
  const difference = Math.abs(imageDimensions.aspectRatio - targetRatio)
  const isCompatible = difference <= tolerance
  
  let recommendation: string | undefined
  
  if (!isCompatible) {
    if (imageDimensions.aspectRatio > targetRatio) {
      recommendation = `Image is wider than target format. Consider cropping horizontally or adding vertical padding.`
    } else {
      recommendation = `Image is taller than target format. Consider cropping vertically or adding horizontal padding.`
    }
  }
  
  return {
    isCompatible,
    recommendation,
    aspectRatioDifference: difference
  }
}