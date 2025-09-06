export interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime: number
  renderTime: number
  memoryUsage?: number
}

export interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  url: string
  userAgent: string
  timestamp: number
  userId?: string
  sessionId: string
}

export interface UserAction {
  type: string
  payload?: any
  timestamp: number
  userId?: string
  sessionId: string
}

class MonitoringService {
  private sessionId: string
  private isEnabled: boolean = true

  constructor() {
    this.sessionId = this.generateSessionId()
    
    // Only setup performance observer in browser
    if (typeof window !== 'undefined') {
      this.setupPerformanceObserver()
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined') return

    // Monitor LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.trackPerformance({
              pageLoadTime: entry.startTime,
              apiResponseTime: 0,
              renderTime: entry.startTime
            })
          }
        }
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.trackError({
              message: `Long task detected: ${entry.duration}ms`,
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: Date.now(),
              sessionId: this.sessionId
            })
          }
        }
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })
    }
  }

  trackPerformance(metrics: PerformanceMetrics) {
    if (!this.isEnabled || typeof window === 'undefined') return

    try {
      // Store in localStorage for batch sending
      const stored = localStorage.getItem('performance_metrics') || '[]'
      const metrics_array = JSON.parse(stored)
      
      metrics_array.push({
        ...metrics,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        url: window.location.href
      })

      // Keep only last 50 metrics
      if (metrics_array.length > 50) {
        metrics_array.shift()
      }

      localStorage.setItem('performance_metrics', JSON.stringify(metrics_array))

      // Send to monitoring endpoint if available
      this.sendMetrics(metrics)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to track performance metrics:', error)
      }
    }
  }

  trackError(error: ErrorInfo) {
    if (!this.isEnabled || typeof window === 'undefined') return

    try {
      // Store in localStorage
      const stored = localStorage.getItem('error_logs') || '[]'
      const errors_array = JSON.parse(stored)
      
      errors_array.push({
        ...error,
        sessionId: this.sessionId
      })

      // Keep only last 100 errors
      if (errors_array.length > 100) {
        errors_array.shift()
      }

      localStorage.setItem('error_logs', JSON.stringify(errors_array))

      // Send to monitoring endpoint
      this.sendError(error)

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Monitoring Error:', error)
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to track error:', err)
      }
    }
  }

  trackUserAction(action: UserAction) {
    if (!this.isEnabled || typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('user_actions') || '[]'
      const actions_array = JSON.parse(stored)
      
      actions_array.push({
        ...action,
        sessionId: this.sessionId
      })

      // Keep only last 200 actions
      if (actions_array.length > 200) {
        actions_array.shift()
      }

      localStorage.setItem('user_actions', JSON.stringify(actions_array))
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to track user action:', error)
      }
    }
  }

  private async sendMetrics(metrics: PerformanceMetrics) {
    try {
      // Only send if we're in browser and have valid window object
      if (typeof window === 'undefined') return

      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...metrics,
          sessionId: this.sessionId,
          timestamp: Date.now(),
          url: window.location.href
        })
      })
    } catch (error) {
      // Silently fail - monitoring shouldn't break the app
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to send metrics:', error)
      }
    }
  }

  private async sendError(error: ErrorInfo) {
    try {
      // Only send if we're in browser and have valid window object
      if (typeof window === 'undefined') return

      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...error,
          sessionId: this.sessionId
        })
      })
    } catch (err) {
      // Silently fail - monitoring shouldn't break the app
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to send error:', err)
      }
    }
  }

  // Get stored metrics for dashboard
  getStoredMetrics() {
    try {
      if (typeof window === 'undefined') {
        return { performance: [], errors: [], actions: [] }
      }

      return {
        performance: JSON.parse(localStorage.getItem('performance_metrics') || '[]'),
        errors: JSON.parse(localStorage.getItem('error_logs') || '[]'),
        actions: JSON.parse(localStorage.getItem('user_actions') || '[]')
      }
    } catch (error) {
      return { performance: [], errors: [], actions: [] }
    }
  }

  // Clear stored data
  clearStoredData() {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('performance_metrics')
    localStorage.removeItem('error_logs')
    localStorage.removeItem('user_actions')
  }

  // Toggle monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  getSessionId() {
    return this.sessionId
  }
}

export const monitoring = new MonitoringService()

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    monitoring.trackError({
      message: event.message,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: monitoring.getSessionId()
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    monitoring.trackError({
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: monitoring.getSessionId()
    })
  })
}