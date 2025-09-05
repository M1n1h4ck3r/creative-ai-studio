'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars'
  className?: string
  text?: string
}

const LoadingSpinner: React.FC<LoadingProps> = ({ 
  size = 'md', 
  variant = 'spinner',
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const variants = {
    spinner: (
      <div className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )} />
    ),
    
    dots: (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-blue-600 rounded-full animate-pulse',
              size === 'sm' ? 'w-2 h-2' : 
              size === 'md' ? 'w-3 h-3' :
              size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    ),

    pulse: (
      <div className={cn(
        'bg-blue-600 rounded-full animate-pulse',
        sizeClasses[size],
        className
      )} />
    ),

    bars: (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-blue-600 animate-pulse',
              size === 'sm' ? 'w-1 h-8' :
              size === 'md' ? 'w-1.5 h-12' :
              size === 'lg' ? 'w-2 h-16' : 'w-3 h-20'
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1.2s'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {variants[variant]}
      {text && (
        <p className={cn(
          'text-gray-600 font-medium',
          size === 'sm' ? 'text-xs' :
          size === 'md' ? 'text-sm' :
          size === 'lg' ? 'text-base' : 'text-lg'
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

// Skeleton components for better loading states
export const ImageSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn(
    'animate-pulse bg-gray-200 rounded-lg aspect-square',
    className
  )} />
)

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse space-y-4 p-6 border rounded-lg', className)}>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
  </div>
)

export const TextSkeleton: React.FC<{ 
  lines?: number
  className?: string 
}> = ({ lines = 3, className }) => (
  <div className={cn('animate-pulse space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i}
        className={cn(
          'h-3 bg-gray-200 rounded',
          i === lines - 1 ? 'w-2/3' : 'w-full'
        )} 
      />
    ))}
  </div>
)

// Loading overlay for full-screen loading
export const LoadingOverlay: React.FC<{
  isLoading: boolean
  text?: string
  children: React.ReactNode
}> = ({ isLoading, text, children }) => {
  if (!isLoading) return <>{children}</>

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <LoadingSpinner 
          size="lg" 
          variant="spinner" 
          text={text || "Carregando..."}
        />
      </div>
    </div>
  )
}

// Button with loading state
export const LoadingButton: React.FC<{
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  disabled?: boolean
  className?: string
  onClick?: () => void
}> = ({ 
  isLoading, 
  children, 
  loadingText, 
  disabled, 
  className,
  onClick 
}) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    className={cn(
      'flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors',
      'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
      className
    )}
  >
    {isLoading && <LoadingSpinner size="sm" className="border-white border-t-transparent" />}
    <span>{isLoading ? (loadingText || 'Carregando...') : children}</span>
  </button>
)

export default LoadingSpinner