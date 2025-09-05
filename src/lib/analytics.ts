import { Analytics } from '@vercel/analytics/react'

// Analytics events for Creative AI Studio
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return

  // Vercel Analytics
  if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID) {
    // @ts-ignore - Vercel analytics
    window.va?.track(eventName, properties)
  }

  // Custom event tracking for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Event:', { eventName, properties })
  }
}

// Predefined events for the Creative AI Studio
export const analytics = {
  // Image Generation Events
  imageGeneration: {
    started: (provider: string, prompt: string) => 
      trackEvent('image_generation_started', { provider, prompt_length: prompt.length }),
    
    completed: (provider: string, duration: number, success: boolean) =>
      trackEvent('image_generation_completed', { provider, duration, success }),
    
    failed: (provider: string, error: string) =>
      trackEvent('image_generation_failed', { provider, error }),
  },

  // User Actions
  user: {
    apiKeyAdded: (provider: string) =>
      trackEvent('api_key_added', { provider }),
    
    templateUsed: (templateId: string) =>
      trackEvent('prompt_template_used', { template_id: templateId }),
    
    imageDownloaded: (provider: string) =>
      trackEvent('image_downloaded', { provider }),
    
    imageFavorited: (provider: string) =>
      trackEvent('image_favorited', { provider }),
  },

  // App Performance
  performance: {
    pageLoad: (page: string, duration: number) =>
      trackEvent('page_load', { page, duration }),
    
    apiResponse: (endpoint: string, duration: number, status: number) =>
      trackEvent('api_response', { endpoint, duration, status }),
  },

  // Errors
  error: {
    caught: (error: Error, context?: string) =>
      trackEvent('error_caught', { 
        message: error.message, 
        stack: error.stack?.slice(0, 500),
        context 
      }),
  }
}

// Error boundary analytics
export const captureError = (error: Error, errorInfo?: any) => {
  analytics.error.caught(error, errorInfo?.componentStack)
  
  // Send to Sentry if configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // @ts-ignore - Sentry
    window.Sentry?.captureException(error, {
      contexts: {
        react: errorInfo
      }
    })
  }
}

// Performance monitoring
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now()
  
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    analytics.performance.apiResponse(name, duration, 200)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    analytics.performance.apiResponse(name, duration, 500)
    throw error
  }
}