'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

// Web Vitals monitoring
export const useWebVitals = (callback?: (metric: any) => void) => {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleWebVitals = (metric: any) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vital:', metric)
      }
      
      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // Send to your analytics service
        callback?.(metric)
      }
    }

    // Dynamic import to avoid loading in SSR
    import('web-vitals').then((webVitals) => {
      webVitals.getCLS(handleWebVitals)
      webVitals.getFID(handleWebVitals)
      webVitals.getFCP(handleWebVitals)
      webVitals.getLCP(handleWebVitals)
      webVitals.getTTFB(handleWebVitals)
    }).catch(() => {
      // web-vitals not available
    })
  }, [callback])
}

// Performance measurement hook
export const usePerformanceMeasure = () => {
  const startTimes = useRef<Map<string, number>>(new Map())

  const start = useCallback((name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      startTimes.current.set(name, performance.now())
    }
  }, [])

  const end = useCallback((name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const startTime = startTimes.current.get(name)
      if (startTime) {
        const duration = performance.now() - startTime
        console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`)
        startTimes.current.delete(name)
        return duration
      }
    }
    return null
  }, [])

  const measure = useCallback(async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    start(name)
    try {
      const result = await fn()
      end(name)
      return result
    } catch (error) {
      end(name)
      throw error
    }
  }, [start, end])

  return { start, end, measure }
}

// Memory usage monitoring
export const useMemoryMonitoring = (interval = 5000) => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number
    total: number
    limit: number
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkMemory = () => {
      if ('performance' in window && 'memory' in performance) {
        const memory = (performance as any).memory
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        })
      }
    }

    checkMemory()
    const intervalId = setInterval(checkMemory, interval)

    return () => clearInterval(intervalId)
  }, [interval])

  return memoryInfo
}

// Network connection monitoring
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<{
    online: boolean
    effectiveType?: string
    downlink?: number
    rtt?: number
    saveData?: boolean
  }>({
    online: typeof window !== 'undefined' ? navigator.onLine : true
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      setNetworkStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData
      })
    }

    const handleOnline = () => updateNetworkStatus()
    const handleOffline = () => updateNetworkStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    // Initial check
    updateNetworkStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [])

  return networkStatus
}

// Component render time tracking
export const useRenderTime = (componentName: string) => {
  const renderCount = useRef(0)
  const startTime = useRef<number>()

  useEffect(() => {
    startTime.current = performance.now()
  })

  useEffect(() => {
    if (startTime.current) {
      const renderTime = performance.now() - startTime.current
      renderCount.current++
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  return {
    renderCount: renderCount.current,
    resetCount: () => { renderCount.current = 0 }
  }
}

// Bundle size monitoring
export const useBundleAnalysis = () => {
  const [bundleInfo, setBundleInfo] = useState<{
    chunks: number
    totalSize: number
    loadTime: number
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkBundleInfo = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsResources = resources.filter(resource => 
        resource.name.includes('.js') && resource.name.includes('/_next/')
      )

      const totalSize = jsResources.reduce((acc, resource) => {
        return acc + (resource.transferSize || 0)
      }, 0)

      const loadTime = jsResources.reduce((acc, resource) => {
        return Math.max(acc, resource.loadEventEnd - resource.startTime)
      }, 0)

      setBundleInfo({
        chunks: jsResources.length,
        totalSize: Math.round(totalSize / 1024), // KB
        loadTime: Math.round(loadTime)
      })
    }

    // Wait for page load
    if (document.readyState === 'complete') {
      checkBundleInfo()
    } else {
      window.addEventListener('load', checkBundleInfo)
      return () => window.removeEventListener('load', checkBundleInfo)
    }
  }, [])

  return bundleInfo
}

// Debounced state hook for performance
export const useDebouncedState = <T>(initialValue: T, delay: number) => {
  const [value, setValue] = useState<T>(initialValue)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return [debouncedValue, setValue] as const
}

// Throttled callback hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(0)

  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args)
      lastRun.current = Date.now()
    }
  }, [callback, delay]) as T
}

// Intersection observer hook for performance
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<Element | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      options
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, options])

  return [setRef, isVisible] as const
}

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(0)

  useEffect(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const newStartIndex = Math.floor(scrollTop / itemHeight)
    const newEndIndex = Math.min(newStartIndex + visibleCount + 1, itemCount - 1)

    setStartIndex(newStartIndex)
    setEndIndex(newEndIndex)
  }, [scrollTop, itemHeight, containerHeight, itemCount])

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    startIndex,
    endIndex,
    onScroll,
    totalHeight: itemCount * itemHeight,
    offsetY: startIndex * itemHeight
  }
}

// Performance dashboard data
export const usePerformanceDashboard = () => {
  const memoryInfo = useMemoryMonitoring()
  const networkStatus = useNetworkStatus()
  const bundleInfo = useBundleAnalysis()
  const { measure } = usePerformanceMeasure()

  return {
    memory: memoryInfo,
    network: networkStatus,
    bundle: bundleInfo,
    measure,
    isOptimal: memoryInfo && memoryInfo.used < memoryInfo.limit * 0.8 && networkStatus.online
  }
}

export {
  useWebVitals,
  usePerformanceMeasure,
  useMemoryMonitoring,
  useNetworkStatus,
  useRenderTime,
  useBundleAnalysis,
  useDebouncedState,
  useThrottledCallback,
  useIntersectionObserver,
  useVirtualScrolling,
  usePerformanceDashboard
}