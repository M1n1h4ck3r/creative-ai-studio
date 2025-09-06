'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Mobile-optimized components and utilities

// Mobile detection hook
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

// Touch-optimized button component
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  icon?: React.ReactNode
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-500'
  }
  
  // Larger touch targets for mobile
  const sizeClasses = {
    sm: 'h-10 px-4 py-2 text-sm min-h-[44px]', // iOS recommended minimum
    md: 'h-12 px-6 py-3 text-base min-h-[48px]',
    lg: 'h-14 px-8 py-4 text-lg min-h-[52px]'
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        'touch-manipulation', // Optimize for touch
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  )
}

// Mobile-optimized input component
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  error,
  icon,
  className,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{icon}</span>
          </div>
        )}
        <input
          className={cn(
            'block w-full rounded-lg border-gray-300 shadow-sm',
            'focus:ring-blue-500 focus:border-blue-500',
            'text-base', // Prevent zoom on iOS
            'min-h-[44px] px-4 py-3', // Touch-friendly size
            icon && 'pl-10',
            error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

// Mobile-optimized textarea
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  autoResize?: boolean
}

export const MobileTextarea: React.FC<MobileTextareaProps> = ({
  label,
  error,
  autoResize = false,
  className,
  ...props
}) => {
  const [height, setHeight] = useState('auto')

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      setHeight('auto')
      setHeight(`${e.target.scrollHeight}px`)
    }
    props.onChange?.(e)
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'block w-full rounded-lg border-gray-300 shadow-sm',
          'focus:ring-blue-500 focus:border-blue-500',
          'text-base resize-none', // Prevent zoom and manual resize
          'min-h-[88px] px-4 py-3', // Double the minimum height for textarea
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        style={autoResize ? { height } : undefined}
        onChange={handleChange}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

// Mobile-optimized select
interface MobileSelectProps {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  error,
  options,
  value,
  onChange,
  placeholder
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'block w-full rounded-lg border-gray-300 shadow-sm',
          'focus:ring-blue-500 focus:border-blue-500',
          'text-base bg-white', // Prevent zoom on iOS
          'min-h-[44px] px-4 py-3',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500'
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}

// Mobile navigation component
interface MobileNavProps {
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onToggle,
  children
}) => {
  const isMobile = useIsMobile()

  if (!isMobile) return null

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={onToggle}
        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center space-y-1">
          <div className={cn(
            'w-full h-0.5 bg-current transform transition-all duration-200',
            isOpen ? 'rotate-45 translate-y-1.5' : ''
          )} />
          <div className={cn(
            'w-full h-0.5 bg-current transition-all duration-200',
            isOpen ? 'opacity-0' : ''
          )} />
          <div className={cn(
            'w-full h-0.5 bg-current transform transition-all duration-200',
            isOpen ? '-rotate-45 -translate-y-1.5' : ''
          )} />
        </div>
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={onToggle}
          />
          <div className="relative flex flex-col w-full max-w-xs ml-auto h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={onToggle}
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900"
              >
                <span className="sr-only">Fechar menu</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Mobile-optimized card component
interface MobileCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  shadow?: boolean
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = true
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200',
      shadow && 'shadow-sm',
      paddingClasses[padding],
      'touch-manipulation', // Optimize for touch
      className
    )}>
      {children}
    </div>
  )
}

// Mobile-optimized bottom sheet/drawer
interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isMobile || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg',
        'transform transition-transform duration-300 ease-out',
        'max-h-[90vh] flex flex-col',
        isOpen ? 'translate-y-0' : 'translate-y-full'
      )}>
        {/* Handle */}
        <div className="flex justify-center p-2">
          <div className="w-8 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-600 hover:text-gray-900"
            >
              <span className="sr-only">Fechar</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized image component
interface MobileImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string
  loading?: 'lazy' | 'eager'
}

export const MobileImage: React.FC<MobileImageProps> = ({
  src,
  alt,
  fallback = '/placeholder.svg',
  loading = 'lazy',
  className,
  ...props
}) => {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={error ? fallback : src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
        {...props}
      />
    </div>
  )
}

// Mobile-optimized toast/notification
interface MobileToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  isVisible: boolean
  onClose: () => void
}

export const MobileToast: React.FC<MobileToastProps> = ({
  message,
  type = 'info',
  isVisible,
  onClose
}) => {
  const typeColors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white'
  }

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <div className={cn(
      'fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg',
      'transform transition-transform duration-300 ease-out',
      typeColors[type],
      isVisible ? 'translate-y-0' : '-translate-y-full',
      'md:max-w-sm md:left-auto md:right-4'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-current opacity-70 hover:opacity-100"
        >
          <span className="sr-only">Fechar</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Mobile-optimized grid layout
interface MobileGridProps {
  children: React.ReactNode
  cols?: {
    mobile: number
    tablet?: number
    desktop?: number
  }
  gap?: number
  className?: string
}

export const MobileGrid: React.FC<MobileGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6'
  }

  return (
    <div className={cn(
      'grid',
      gridCols[cols.mobile],
      cols.tablet && `md:${gridCols[cols.tablet]}`,
      cols.desktop && `lg:${gridCols[cols.desktop]}`,
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  )
}