import { Analytics } from '@vercel/analytics/react'

// Enhanced analytics with multiple providers and batch support
class AnalyticsManager {
  private eventQueue: Array<{event: string, properties: Record<string, any>, timestamp: number}> = []
  private batchTimeout?: NodeJS.Timeout
  private readonly BATCH_SIZE = 10
  private readonly BATCH_TIMEOUT = 5000 // 5 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      // Flush queue on page unload
      window.addEventListener('beforeunload', () => {
        this.flush()
      })

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEvent('page_hidden')
        } else {
          this.trackEvent('page_visible')
        }
      })

      // Track performance metrics
      this.trackWebVitals()
    }
  }

  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined') return

    const eventData = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        session_id: getSessionId(),
        user_id: getUserId(),
        url: window.location.href,
        user_agent: navigator.userAgent
      },
      timestamp: Date.now()
    }

    // Add to queue for batching
    this.eventQueue.push(eventData)

    // Immediate external service tracking
    this.trackToExternalServices(eventName, eventData.properties)

    // Custom event tracking for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventData)
    }

    // Batch processing
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flush()
    } else {
      this.scheduleBatch()
    }
  }

  private trackToExternalServices(eventName: string, properties: Record<string, any>) {
    // Vercel Analytics
    if (process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID) {
      // @ts-ignore - Vercel analytics
      window.va?.track(eventName, properties)
    }

    // Google Analytics 4
    if (process.env.NEXT_PUBLIC_GA_ID && typeof window !== 'undefined') {
      // @ts-ignore - Google Analytics
      window.gtag?.('event', eventName, {
        ...properties,
        event_category: 'ai_studio',
        timestamp: new Date().toISOString(),
      })
    }

    // Mixpanel tracking
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN && typeof window !== 'undefined') {
      // @ts-ignore - Mixpanel
      window.mixpanel?.track(eventName, {
        ...properties,
        app: 'creative-ai-studio',
        timestamp: Date.now(),
      })
    }
  }

  private scheduleBatch() {
    if (this.batchTimeout) return

    this.batchTimeout = setTimeout(() => {
      this.flush()
    }, this.BATCH_TIMEOUT)
  }

  private flush() {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = undefined
    }

    // Send batch to analytics API
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: events.map(e => ({
          event: e.event,
          properties: e.properties
        })),
        batch: true
      })
    }).catch(err => {
      console.warn('Analytics batch failed:', err)
      // Re-queue failed events
      this.eventQueue.unshift(...events)
    })
  }

  private trackWebVitals() {
    if (typeof window === 'undefined') return

    // Track Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => this.trackEvent('web_vital_cls', { value: metric.value }))
      getFID((metric) => this.trackEvent('web_vital_fid', { value: metric.value }))
      getFCP((metric) => this.trackEvent('web_vital_fcp', { value: metric.value }))
      getLCP((metric) => this.trackEvent('web_vital_lcp', { value: metric.value }))
      getTTFB((metric) => this.trackEvent('web_vital_ttfb', { value: metric.value }))
    }).catch(() => {
      // Web vitals not available
    })
  }
}

// Global analytics manager instance
const analyticsManager = new AnalyticsManager()

// Export track function for backward compatibility
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  analyticsManager.trackEvent(eventName, properties)
}

// Session management for analytics
let sessionId: string | null = null
let userId: string | null = null

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
  }
  return sessionId
}

const getUserId = (): string | null => {
  if (!userId && typeof window !== 'undefined') {
    userId = localStorage.getItem('analytics_user_id') || 
             `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('analytics_user_id', userId)
  }
  return userId
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