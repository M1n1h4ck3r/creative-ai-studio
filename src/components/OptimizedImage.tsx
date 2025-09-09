'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Loader2, ImageIcon } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  quality?: number
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  fallback?: React.ReactNode
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  loading = 'lazy',
  onLoad,
  onError,
  fallback
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // Auto-detect image dimensions if not provided
  useEffect(() => {
    if (!width || !height) {
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = src
    }
  }, [src, width, height])

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Generate blur data URL for placeholder
  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, w, h)
    }
    return canvas.toDataURL()
  }

  const finalWidth = width || imageDimensions?.width || 400
  const finalHeight = height || imageDimensions?.height || 300
  const finalBlurDataURL = blurDataURL || (placeholder === 'blur' ? generateBlurDataURL(10, 10) : undefined)

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{ width: finalWidth, height: finalHeight }}
      >
        {fallback || (
          <div className="text-center text-gray-500 p-4">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Failed to load image</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width: finalWidth, height: finalHeight }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        width={finalWidth}
        height={finalHeight}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={finalBlurDataURL}
        sizes={sizes}
        quality={quality}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}

// Progressive image loading with different quality levels
export const ProgressiveImage = ({
  src,
  alt,
  className = '',
  ...props
}: Omit<OptimizedImageProps, 'quality'>) => {
  const [currentQuality, setCurrentQuality] = useState(20) // Start with low quality
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false)

  useEffect(() => {
    // Preload high quality image
    const highQualityImg = new window.Image()
    highQualityImg.onload = () => {
      setCurrentQuality(80)
      setIsHighQualityLoaded(true)
    }
    highQualityImg.src = `${src}?q=80`
  }, [src])

  return (
    <OptimizedImage
      {...props}
      src={`${src}?q=${currentQuality}`}
      alt={alt}
      className={`${className} ${isHighQualityLoaded ? '' : 'blur-sm'} transition-all duration-500`}
      quality={currentQuality}
    />
  )
}

// Responsive image component with multiple breakpoints
export const ResponsiveImage = ({
  src,
  alt,
  className = '',
  breakpoints = {
    sm: { width: 400, height: 300 },
    md: { width: 600, height: 450 },
    lg: { width: 800, height: 600 },
    xl: { width: 1200, height: 900 }
  },
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'sizes'> & {
  breakpoints?: Record<string, { width: number; height: number }>
}) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState('md')

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) setCurrentBreakpoint('sm')
      else if (width < 768) setCurrentBreakpoint('md')
      else if (width < 1024) setCurrentBreakpoint('lg')
      else setCurrentBreakpoint('xl')
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { width, height } = breakpoints[currentBreakpoint] || breakpoints.md

  return (
    <OptimizedImage
      {...props}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes="(max-width: 640px) 400px, (max-width: 768px) 600px, (max-width: 1024px) 800px, 1200px"
    />
  )
}

// Lazy loading image with intersection observer
export const LazyImage = ({
  src,
  alt,
  className = '',
  rootMargin = '50px',
  threshold = 0.1,
  ...props
}: OptimizedImageProps & {
  rootMargin?: string
  threshold?: number
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold }
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, rootMargin, threshold])

  return (
    <div ref={setRef} className={className}>
      {isVisible ? (
        <OptimizedImage
          {...props}
          src={src}
          alt={alt}
          loading="lazy"
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-gray-100 animate-pulse"
          style={{ width: props.width || 400, height: props.height || 300 }}
        >
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  )
}

// Image gallery with lazy loading and optimization
export const OptimizedGallery = ({
  images,
  className = '',
  itemClassName = '',
  columns = 3,
  gap = 4
}: {
  images: Array<{
    src: string
    alt: string
    width?: number
    height?: number
  }>
  className?: string
  itemClassName?: string
  columns?: number
  gap?: number
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
  }

  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols]} ${gapClasses[gap as keyof typeof gapClasses]} ${className}`}>
      {images.map((image, index) => (
        <div key={index} className={itemClassName}>
          <LazyImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="rounded-lg overflow-hidden"
            priority={index < 3} // Prioritize first 3 images
          />
        </div>
      ))}
    </div>
  )
}

export default OptimizedImage