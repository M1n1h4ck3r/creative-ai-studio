// Performance optimization utilities
import { unstable_cache } from 'next/cache'

// Dynamic imports for heavy libraries
export const loadHeavyLibraries = {
  // Load chart libraries only when needed
  chartjs: () => import('chart.js/auto'),
  
  // Load syntax highlighter only when needed
  syntaxHighlighter: () => import('react-syntax-highlighter'),
  
  // Load PDF generation only when needed
  jspdf: () => import('jspdf'),
  
  // Load image processing only when needed
  sharp: () => import('sharp').catch(() => null), // Optional dependency
  
  // Load analytics only when needed
  analytics: () => import('@vercel/analytics'),
  
  // Load monitoring only when needed
  sentry: () => import('@sentry/nextjs'),
}

// Image optimization utilities
export const imageOptimization = {
  // Get optimal image size based on device
  getOptimalImageSize: (originalWidth: number, originalHeight: number, maxWidth = 800) => {
    if (originalWidth <= maxWidth) {
      return { width: originalWidth, height: originalHeight }
    }
    
    const aspectRatio = originalHeight / originalWidth
    return {
      width: maxWidth,
      height: Math.round(maxWidth * aspectRatio)
    }
  },
  
  // Generate WebP format images when possible
  getImageFormat: (userAgent?: string) => {
    if (!userAgent) return 'jpeg'
    
    // Check WebP support
    if (userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Edge')) {
      return 'webp'
    }
    
    return 'jpeg'
  },
  
  // Generate responsive image sources
  generateImageSources: (baseUrl: string, sizes: number[] = [400, 800, 1200]) => {
    return sizes.map(size => ({
      srcSet: `${baseUrl}?w=${size}&q=80`,
      size: `(max-width: ${size}px) 100vw, ${size}px`
    }))
  }
}

// Component lazy loading helpers
export const LazyComponents = {
  // Lazy load heavy UI components
  ImageGenerator: () => import('@/components/ImageGenerator'),
  Dashboard: () => import('@/components/Dashboard'),
  BatchGenerator: () => import('@/components/BatchGenerator'),
  Settings: () => import('@/components/Settings'),
  Analytics: () => import('@/components/Analytics'),
  
  // Lazy load modal/dialog components
  ImageModal: () => import('@/components/ImageModal'),
  SettingsModal: () => import('@/components/SettingsModal'),
  
  // Lazy load charts and visualizations
  UsageChart: () => import('@/components/UsageChart'),
  MetricsChart: () => import('@/components/MetricsChart'),
}

// API response caching
export const cacheConfig = {
  // Cache static data for 1 hour
  staticData: {
    revalidate: 3600,
    tags: ['static']
  },
  
  // Cache user data for 5 minutes
  userData: {
    revalidate: 300,
    tags: ['user']
  },
  
  // Cache API keys for 15 minutes
  apiKeys: {
    revalidate: 900,
    tags: ['api-keys']
  },
  
  // Cache generation results for 24 hours
  generations: {
    revalidate: 86400,
    tags: ['generations']
  }
}

// Create cached functions
export const getCachedData = {
  userProfile: unstable_cache(
    async (userId: string) => {
      // This would be replaced with actual data fetching
      return { userId, cached: true }
    },
    ['user-profile'],
    cacheConfig.userData
  ),
  
  apiKeys: unstable_cache(
    async (userId: string) => {
      // This would be replaced with actual API key fetching
      return { userId, keys: [] }
    },
    ['api-keys'],
    cacheConfig.apiKeys
  )
}

// Bundle splitting helpers
export const bundleSplitting = {
  // Split vendor libraries
  vendors: {
    react: ['react', 'react-dom'],
    ui: ['@radix-ui/*', 'lucide-react', 'framer-motion'],
    forms: ['react-hook-form', '@hookform/resolvers'],
    ai: ['@google/generative-ai', 'openai', '@huggingface/inference'],
    utils: ['lodash', 'date-fns', 'dayjs', 'nanoid'],
    crypto: ['bcryptjs', 'jsonwebtoken'],
    db: ['@supabase/*'],
    analytics: ['@vercel/analytics', '@sentry/nextjs']
  }
}

// Performance monitoring
export const performanceMonitoring = {
  // Measure component render time
  measureRender: (componentName: string, fn: () => void) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const start = performance.now()
      fn()
      const end = performance.now()
      console.log(`${componentName} render time: ${end - start}ms`)
    } else {
      fn()
    }
  },
  
  // Track Core Web Vitals
  trackWebVitals: (metric: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      console.log('Web Vital:', metric)
    }
  },
  
  // Memory usage monitoring
  checkMemoryUsage: () => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
    return null
  }
}

// Resource preloading
export const preloadResources = {
  // Preload critical fonts
  fonts: [
    { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', as: 'style' }
  ],
  
  // Preload critical images
  images: (urls: string[]) => {
    if (typeof window !== 'undefined') {
      urls.forEach(url => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = url
        document.head.appendChild(link)
      })
    }
  },
  
  // Preload API routes
  routes: (routes: string[]) => {
    if (typeof window !== 'undefined') {
      routes.forEach(route => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'fetch'
        link.href = route
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      })
    }
  }
}

// Virtual scrolling for large lists
export class VirtualList {
  private itemHeight: number
  private containerHeight: number
  private scrollTop: number = 0
  
  constructor(itemHeight: number, containerHeight: number) {
    this.itemHeight = itemHeight
    this.containerHeight = containerHeight
  }
  
  getVisibleRange(totalItems: number) {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(this.containerHeight / this.itemHeight) + 1,
      totalItems - 1
    )
    
    return { startIndex, endIndex }
  }
  
  updateScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop
  }
}

// Debounce and throttle utilities
export const optimize = {
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeoutId: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), wait)
    }) as T
  },
  
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }) as T
  },
  
  // Memoization helper
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map()
    return ((...args: any[]) => {
      const key = JSON.stringify(args)
      if (cache.has(key)) {
        return cache.get(key)
      }
      const result = fn(...args)
      cache.set(key, result)
      return result
    }) as T
  }
}

export default {
  loadHeavyLibraries,
  imageOptimization,
  LazyComponents,
  cacheConfig,
  getCachedData,
  bundleSplitting,
  performanceMonitoring,
  preloadResources,
  VirtualList,
  optimize
}