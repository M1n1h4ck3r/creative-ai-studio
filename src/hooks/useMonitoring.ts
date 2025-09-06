import { useEffect, useCallback } from 'react'
import { monitoring } from '@/lib/monitoring'

export interface UseMonitoringOptions {
  trackPageViews?: boolean
  trackUserActions?: boolean
  trackPerformance?: boolean
  enabled?: boolean
}

export function useMonitoring(options: UseMonitoringOptions = {}) {
  const {
    trackPageViews = true,
    trackUserActions = true,
    trackPerformance = true,
    enabled = true
  } = options

  // Track page view
  useEffect(() => {
    if (!enabled || !trackPageViews || typeof window === 'undefined') return

    try {
      const startTime = performance.now()
      
      // Track page load performance
      const handleLoad = () => {
        try {
          const loadTime = performance.now() - startTime
          
          monitoring.trackPerformance({
            pageLoadTime: loadTime,
            apiResponseTime: 0,
            renderTime: loadTime
          })

          // Track page view as user action
          monitoring.trackUserAction({
            type: 'page_view',
            payload: {
              path: window.location.pathname,
              search: window.location.search,
              referrer: document.referrer
            },
            timestamp: Date.now()
          })
        } catch (error) {
          // Silently ignore monitoring errors
          if (process.env.NODE_ENV === 'development') {
            console.warn('Page load tracking error:', error)
          }
        }
      }

      if (document.readyState === 'complete') {
        handleLoad()
      } else {
        window.addEventListener('load', handleLoad)
        return () => window.removeEventListener('load', handleLoad)
      }
    } catch (error) {
      // Silently ignore monitoring setup errors
      if (process.env.NODE_ENV === 'development') {
        console.warn('Monitoring setup error:', error)
      }
    }
  }, [enabled, trackPageViews])

  // Track performance metrics
  const trackApiCall = useCallback((endpoint: string, startTime: number, endTime?: number) => {
    if (!enabled || !trackPerformance || typeof window === 'undefined') return

    try {
      const responseTime = (endTime || performance.now()) - startTime

      monitoring.trackPerformance({
        pageLoadTime: 0,
        apiResponseTime: responseTime,
        renderTime: 0
      })

      monitoring.trackUserAction({
        type: 'api_call',
        payload: {
          endpoint,
          responseTime,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      })
    } catch (error) {
      // Silently ignore monitoring errors
      if (process.env.NODE_ENV === 'development') {
        console.warn('API call tracking error:', error)
      }
    }
  }, [enabled, trackPerformance])

  // Track user actions
  const trackAction = useCallback((actionType: string, payload?: any) => {
    if (!enabled || !trackUserActions) return

    monitoring.trackUserAction({
      type: actionType,
      payload,
      timestamp: Date.now()
    })
  }, [enabled, trackUserActions])

  // Track form submissions
  const trackFormSubmission = useCallback((formName: string, success: boolean, errorMessage?: string) => {
    if (!enabled) return

    monitoring.trackUserAction({
      type: 'form_submission',
      payload: {
        formName,
        success,
        errorMessage
      },
      timestamp: Date.now()
    })
  }, [enabled])

  // Track button clicks
  const trackClick = useCallback((elementName: string, elementType: string = 'button') => {
    if (!enabled) return

    monitoring.trackUserAction({
      type: 'click',
      payload: {
        elementName,
        elementType,
        path: window.location.pathname
      },
      timestamp: Date.now()
    })
  }, [enabled])

  // Track search actions
  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    if (!enabled) return

    monitoring.trackUserAction({
      type: 'search',
      payload: {
        query,
        resultsCount
      },
      timestamp: Date.now()
    })
  }, [enabled])

  return {
    trackAction,
    trackApiCall,
    trackFormSubmission,
    trackClick,
    trackSearch,
    sessionId: monitoring.getSessionId(),
    getStoredMetrics: monitoring.getStoredMetrics.bind(monitoring),
    clearStoredData: monitoring.clearStoredData.bind(monitoring)
  }
}