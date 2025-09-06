import { useState, useEffect, useCallback, useRef } from 'react'

// Mobile device detection and optimization hooks

export interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  orientation: 'portrait' | 'landscape'
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  browserSupport: {
    webp: boolean
    avif: boolean
    touchEvents: boolean
    serviceWorker: boolean
    webgl: boolean
  }
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'lg',
    orientation: 'landscape',
    platform: 'unknown',
    browserSupport: {
      webp: false,
      avif: false,
      touchEvents: false,
      serviceWorker: false,
      webgl: false
    }
  })

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent.toLowerCase()

      // Screen size detection
      let screenSize: DeviceInfo['screenSize'] = 'lg'
      if (width < 640) screenSize = 'xs'
      else if (width < 768) screenSize = 'sm'
      else if (width < 1024) screenSize = 'md'
      else if (width < 1280) screenSize = 'lg'
      else screenSize = 'xl'

      // Device type detection
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024

      // Touch detection
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Orientation
      const orientation: DeviceInfo['orientation'] = width > height ? 'landscape' : 'portrait'

      // Platform detection
      let platform: DeviceInfo['platform'] = 'unknown'
      if (/iphone|ipad|ipod/.test(userAgent)) platform = 'ios'
      else if (/android/.test(userAgent)) platform = 'android'
      else if (!isMobile && !isTablet) platform = 'desktop'

      // Browser support detection
      const canvas = document.createElement('canvas')
      const webglContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

      const browserSupport: DeviceInfo['browserSupport'] = {
        webp: checkWebPSupport(),
        avif: checkAVIFSupport(),
        touchEvents: 'ontouchstart' in window,
        serviceWorker: 'serviceWorker' in navigator,
        webgl: !!webglContext
      }

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        orientation,
        platform,
        browserSupport
      })
    }

    detectDevice()
    window.addEventListener('resize', detectDevice)
    window.addEventListener('orientationchange', detectDevice)

    return () => {
      window.removeEventListener('resize', detectDevice)
      window.removeEventListener('orientationchange', detectDevice)
    }
  }, [])

  return deviceInfo
}

// WebP support detection
const checkWebPSupport = (): boolean => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').startsWith('data:image/webp')
}

// AVIF support detection
const checkAVIFSupport = (): boolean => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  try {
    return canvas.toDataURL('image/avif').startsWith('data:image/avif')
  } catch {
    return false
  }
}

// Mobile-optimized viewport management
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    scrollY: 0,
    isScrolling: false
  })

  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  const handleResize = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      width: window.innerWidth,
      height: window.innerHeight
    }))
  }, [])

  const handleScroll = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scrollY: window.scrollY,
      isScrolling: true
    }))

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setViewport(prev => ({
        ...prev,
        isScrolling: false
      }))
    }, 150)
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleResize, handleScroll])

  return viewport
}

// Touch gesture handling
export interface TouchGesture {
  startX: number
  startY: number
  endX: number
  endY: number
  deltaX: number
  deltaY: number
  duration: number
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
}

export const useTouchGestures = (
  elementRef: React.RefObject<HTMLElement>,
  options: {
    threshold?: number
    onSwipe?: (gesture: TouchGesture) => void
    onTap?: (e: TouchEvent) => void
    onDoubleTap?: (e: TouchEvent) => void
    onPinch?: (scale: number) => void
  } = {}
) => {
  const {
    threshold = 50,
    onSwipe,
    onTap,
    onDoubleTap,
    onPinch
  } = options

  const gestureRef = useRef<{
    startTime: number
    startX: number
    startY: number
    lastTap: number
    touches: TouchList | null
  }>({
    startTime: 0,
    startX: 0,
    startY: 0,
    lastTap: 0,
    touches: null
  })

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      gestureRef.current = {
        startTime: Date.now(),
        startX: touch.clientX,
        startY: touch.clientY,
        lastTap: gestureRef.current.lastTap,
        touches: e.touches
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (onPinch && e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        
        // Calculate scale based on initial distance (simplified)
        const scale = distance / 100 // Normalize
        onPinch(scale)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      const endTime = Date.now()
      const deltaTime = endTime - gestureRef.current.startTime
      
      const deltaX = touch.clientX - gestureRef.current.startX
      const deltaY = touch.clientY - gestureRef.current.startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      const gesture: TouchGesture = {
        startX: gestureRef.current.startX,
        startY: gestureRef.current.startY,
        endX: touch.clientX,
        endY: touch.clientY,
        deltaX,
        deltaY,
        duration: deltaTime,
        direction: null,
        distance
      }

      // Determine direction
      if (distance > threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          gesture.direction = deltaX > 0 ? 'right' : 'left'
        } else {
          gesture.direction = deltaY > 0 ? 'down' : 'up'
        }
        onSwipe?.(gesture)
      } else if (deltaTime < 300) {
        // Tap detection
        const timeSinceLastTap = endTime - gestureRef.current.lastTap
        
        if (timeSinceLastTap < 300) {
          // Double tap
          onDoubleTap?.(e)
        } else {
          // Single tap
          onTap?.(e)
        }
        
        gestureRef.current.lastTap = endTime
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, threshold, onSwipe, onTap, onDoubleTap, onPinch])
}

// Mobile performance optimization
export const useMobilePerformance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memoryUsage: 0,
    connectionType: 'unknown' as 'slow-2g' | '2g' | '3g' | '4g' | 'unknown',
    reducedMotion: false,
    batteryLevel: 1,
    isLowPowerMode: false
  })

  useEffect(() => {
    // Memory usage
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage: memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
      }))
    }

    // Connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setPerformanceMetrics(prev => ({
        ...prev,
        connectionType: connection.effectiveType || 'unknown'
      }))
    }

    // Reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPerformanceMetrics(prev => ({
      ...prev,
      reducedMotion: mediaQuery.matches
    }))

    // Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setPerformanceMetrics(prev => ({
          ...prev,
          batteryLevel: battery.level,
          isLowPowerMode: battery.level < 0.2
        }))

        battery.addEventListener('levelchange', () => {
          setPerformanceMetrics(prev => ({
            ...prev,
            batteryLevel: battery.level,
            isLowPowerMode: battery.level < 0.2
          }))
        })
      })
    }
  }, [])

  return performanceMetrics
}

// Mobile-optimized image loading
export const useMobileImageLoading = (src: string, options: {
  lowQualitySrc?: string
  webpSrc?: string
  avifSrc?: string
  lazy?: boolean
} = {}) => {
  const [currentSrc, setCurrentSrc] = useState(options.lowQualitySrc || src)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const deviceInfo = useDeviceDetection()

  useEffect(() => {
    const img = new Image()
    
    // Choose best format based on browser support
    let bestSrc = src
    if (deviceInfo.browserSupport.avif && options.avifSrc) {
      bestSrc = options.avifSrc
    } else if (deviceInfo.browserSupport.webp && options.webpSrc) {
      bestSrc = options.webpSrc
    }

    img.onload = () => {
      setCurrentSrc(bestSrc)
      setIsLoaded(true)
    }

    img.onerror = () => {
      setError(true)
      if (bestSrc !== src) {
        // Fallback to original format
        img.src = src
      }
    }

    img.src = bestSrc
  }, [src, options.webpSrc, options.avifSrc, deviceInfo.browserSupport])

  return {
    src: currentSrc,
    isLoaded,
    error
  }
}

// Infinite scroll for mobile
export const useInfiniteScroll = (
  callback: () => void,
  options: {
    threshold?: number
    enabled?: boolean
  } = {}
) => {
  const { threshold = 100, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        callback()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [callback, threshold, enabled])
}

// Mobile-optimized virtual scrolling
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
    top: (startIndex + index) * itemHeight
  }))

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    handleScroll
  }
}