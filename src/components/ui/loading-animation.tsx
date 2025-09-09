'use client'

import { cn } from '@/lib/utils'
import { Sparkles, Zap, Palette, Wand2 } from 'lucide-react'

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'gradient' | 'pulse'
  text?: string
  className?: string
}

export function LoadingAnimation({ 
  size = 'md', 
  variant = 'default', 
  text = 'Carregando...',
  className 
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  if (variant === 'gradient') {
    return (
      <div className={cn('flex flex-col items-center space-y-4', className)}>
        <div className="relative">
          <div className={cn(
            'rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin',
            sizeClasses[size]
          )}>
            <div className={cn(
              'absolute inset-1 rounded-full bg-background',
              'flex items-center justify-center'
            )}>
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            </div>
          </div>
        </div>
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center space-y-4', className)}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce"></div>
        </div>
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className={cn(
        'border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin',
        sizeClasses[size]
      )}></div>
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )
}

export function GenerationLoadingAnimation({ 
  progress, 
  text = 'Gerando imagem...',
  className 
}: { 
  progress?: number
  text?: string
  className?: string 
}) {
  return (
    <div className={cn('flex flex-col items-center space-y-6 p-8', className)}>
      {/* Animated Icons */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 animate-ping">
          <div className="w-16 h-16 bg-blue-500 rounded-full opacity-20"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
          <div className="flex space-x-1">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <Wand2 className="w-4 h-4 text-white animate-bounce" />
          </div>
        </div>
        
        {/* Orbiting elements */}
        <div className="absolute inset-0 animate-spin [animation-duration:3s]">
          <Palette className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-4 h-4 text-pink-500" />
        </div>
        <div className="absolute inset-0 animate-spin [animation-duration:2s] [animation-direction:reverse]">
          <Zap className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-4 h-4 text-yellow-500" />
        </div>
      </div>
      
      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Status text */}
      <div className="text-center space-y-2">
        <p className="font-medium text-lg">{text}</p>
        <p className="text-sm text-muted-foreground">
          Isso pode levar alguns segundos...
        </p>
      </div>
      
      {/* Tips carousel */}
      <div className="max-w-md text-center">
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          💡 <strong>Dica:</strong> Prompts mais detalhados geram resultados melhores. 
          Tente incluir informações sobre estilo, cores e composição!
        </p>
      </div>
    </div>
  )
}

export default LoadingAnimation