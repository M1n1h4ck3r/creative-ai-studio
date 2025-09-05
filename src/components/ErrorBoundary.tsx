'use client'

import React from 'react'
import { captureError } from '@/lib/analytics'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo)
    captureError(error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      
      return (
        <Fallback 
          error={this.state.error} 
          reset={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({ 
  error, 
  reset 
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center p-6 max-w-md mx-auto">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Algo deu errado
        </h2>
        <p className="text-gray-600 mb-4">
          Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
        </p>
        <details className="text-left text-sm text-gray-500 mb-6 bg-gray-100 p-3 rounded">
          <summary className="cursor-pointer font-medium">Detalhes técnicos</summary>
          <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
        </details>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Recarregar página
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for handling async errors
export const useErrorHandler = () => {
  return React.useCallback((error: Error, context?: string) => {
    console.error('🚨 Async error handled:', error)
    captureError(error, context)
  }, [])
}