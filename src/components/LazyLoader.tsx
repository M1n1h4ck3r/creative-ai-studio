'use client'

import { lazy, Suspense, ComponentType, ReactNode, useRef, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

// Loading spinner component
const LoadingSpinner = ({ size = 'default', text }: { size?: 'sm' | 'default' | 'lg', text?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-600`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )
}

// Skeleton loader component
const SkeletonLoader = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

// Generic lazy loading wrapper
interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

export const LazyWrapper = ({ children, fallback, className }: LazyWrapperProps) => (
  <Suspense 
    fallback={fallback || <LoadingSpinner />}
  >
    <div className={className}>
      {children}
    </div>
  </Suspense>
)

// Lazy load components with error boundaries
export const withLazyLoading = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode,
  errorFallback?: ReactNode
) => {
  const LazyComponent = lazy(importFn)

  return (props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// Pre-defined lazy components (only for components that exist)
export const LazyComponents = {
  // Image generation
  ImageGenerator: withLazyLoading(() => import('@/components/ImageGenerator'), <LoadingSpinner text="Loading Generator..." />),
  
  // Developer tools  
  ApiDocumentation: withLazyLoading(() => import('@/components/ApiDocumentation'), <LoadingSpinner text="Loading Documentation..." />),
  DeveloperAPI: withLazyLoading(() => import('@/components/DeveloperAPI'), <LoadingSpinner text="Loading API Tools..." />),
}

// Progressive loading for heavy pages
export const ProgressiveLoader = ({ 
  components,
  interval = 100,
  className = ''
}: {
  components: Array<{ component: ReactNode; delay?: number }>
  interval?: number
  className?: string
}) => {
  return (
    <div className={className}>
      {components.map((item, index) => (
        <div 
          key={index}
          style={{ 
            animation: `fadeIn 0.5s ease-in-out ${(item.delay || index * interval)}ms both` 
          }}
        >
          {item.component}
        </div>
      ))}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Intersection observer for lazy loading on scroll
export const useIntersectionLoader = (callback: () => void, threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback()
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [callback, threshold])

  return ref
}

// Preload component on hover
export const PreloadOnHover = ({ 
  component, 
  children,
  className = ''
}: {
  component: () => Promise<any>
  children: ReactNode
  className?: string
}) => {
  const handleMouseEnter = () => {
    // Preload the component
    component()
  }

  return (
    <div 
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </div>
  )
}

// Viewport-based lazy loading
export const ViewportLazy = ({ 
  children, 
  rootMargin = '50px',
  className = ''
}: {
  children: ReactNode
  rootMargin?: string
  className?: string
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [rootMargin])

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : <SkeletonLoader className="h-32 w-full" />}
    </div>
  )
}

export default LazyComponents