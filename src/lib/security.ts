import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { generateCSRFToken, verifyCSRFToken } from './encryption'

// Security headers configuration
export const securityHeaders = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: http:",
    "connect-src 'self' https://*.supabase.co https://*.google.com https://*.openai.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  // HSTS (only in production)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
  }),
  
  // Privacy and referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// Rate limiting thresholds
export const rateLimits = {
  // API routes
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many API requests, please try again later.'
  },
  
  // Generation endpoints (more restrictive)
  generation: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 generations per minute
    message: 'Too many generation requests, please wait before trying again.'
  },
  
  // Auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .substring(0, 5000) // Limit length
}

// Validate prompt for AI generation
export function validatePrompt(prompt: string): { valid: boolean; sanitized: string; errors: string[] } {
  const errors: string[] = []
  
  if (!prompt || typeof prompt !== 'string') {
    errors.push('Prompt is required and must be a string')
    return { valid: false, sanitized: '', errors }
  }
  
  const sanitized = sanitizeInput(prompt)
  
  if (sanitized.length < 3) {
    errors.push('Prompt must be at least 3 characters long')
  }
  
  if (sanitized.length > 2000) {
    errors.push('Prompt must not exceed 2000 characters')
  }
  
  // Check for potentially harmful content
  const harmfulPatterns = [
    /(?:hack|exploit|vulnerability|injection|bypass)/gi,
    /(?:admin|root|system|password|token|secret)/gi,
    /(?:delete|drop|truncate|alter)\s+(?:table|database)/gi
  ]
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(sanitized)) {
      errors.push('Prompt contains potentially harmful content')
      break
    }
  }
  
  return {
    valid: errors.length === 0,
    sanitized,
    errors
  }
}

// CSRF protection middleware
export class CSRFProtection {
  private static tokenStore = new Map<string, { token: string; expires: number }>()
  
  static generateToken(sessionId: string): string {
    const token = generateCSRFToken()
    const expires = Date.now() + (60 * 60 * 1000) // 1 hour
    
    this.tokenStore.set(sessionId, { token, expires })
    
    // Clean up expired tokens
    this.cleanupExpiredTokens()
    
    return token
  }
  
  static verifyToken(sessionId: string, providedToken: string): boolean {
    const stored = this.tokenStore.get(sessionId)
    
    if (!stored || stored.expires < Date.now()) {
      this.tokenStore.delete(sessionId)
      return false
    }
    
    return verifyCSRFToken(providedToken, stored.token)
  }
  
  private static cleanupExpiredTokens(): void {
    const now = Date.now()
    for (const [sessionId, data] of this.tokenStore.entries()) {
      if (data.expires < now) {
        this.tokenStore.delete(sessionId)
      }
    }
  }
}

// Security middleware for Next.js API routes
export function withSecurity(handler: Function) {
  return async (req: NextRequest, res: NextResponse) => {
    try {
      // Add security headers
      const response = NextResponse.next()
      
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      // CSRF protection for state-changing operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers.get('x-csrf-token')
        const sessionId = req.cookies.get('session-id')?.value
        
        if (!sessionId || !csrfToken || !CSRFProtection.verifyToken(sessionId, csrfToken)) {
          return NextResponse.json(
            { error: 'Invalid or missing CSRF token' },
            { status: 403 }
          )
        }
      }
      
      // Input validation and sanitization
      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}))
        
        // Sanitize common input fields
        if (body.prompt) {
          const validation = validatePrompt(body.prompt)
          if (!validation.valid) {
            return NextResponse.json(
              { error: 'Invalid input', details: validation.errors },
              { status: 400 }
            )
          }
          body.prompt = validation.sanitized
        }
        
        // Validate other common fields
        if (body.email && typeof body.email === 'string') {
          body.email = sanitizeInput(body.email).toLowerCase()
        }
        
        if (body.name && typeof body.name === 'string') {
          body.name = sanitizeInput(body.name)
        }
      }
      
      return handler(req, response)
    } catch (error) {
      console.error('Security middleware error:', error)
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      )
    }
  }
}

// API key validation
export function validateApiKey(apiKey: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!apiKey || typeof apiKey !== 'string') {
    errors.push('API key is required')
    return { valid: false, errors }
  }
  
  const sanitized = apiKey.trim()
  
  if (sanitized.length < 10) {
    errors.push('API key appears to be too short')
  }
  
  if (sanitized.length > 200) {
    errors.push('API key appears to be too long')
  }
  
  // Basic format validation for common providers
  const providers = {
    openai: /^sk-[a-zA-Z0-9]{48}$/,
    gemini: /^[a-zA-Z0-9-_]{39}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-_]+$/
  }
  
  let validFormat = false
  for (const [provider, pattern] of Object.entries(providers)) {
    if (pattern.test(sanitized)) {
      validFormat = true
      break
    }
  }
  
  if (!validFormat) {
    // Don't be too strict - some providers may have different formats
    console.warn('API key format not recognized, but allowing it')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Error message sanitization
export function sanitizeErrorMessage(error: any, isProduction: boolean = process.env.NODE_ENV === 'production'): string {
  if (!error) return 'An unknown error occurred'
  
  const message = error.message || error.toString() || 'An unknown error occurred'
  
  if (!isProduction) {
    return message
  }
  
  // In production, sanitize error messages to prevent information disclosure
  const sensitivePatterns = [
    /password/gi,
    /token/gi,
    /key/gi,
    /secret/gi,
    /database/gi,
    /connection/gi,
    /file.*not.*found/gi,
    /permission.*denied/gi,
    /unauthorized/gi
  ]
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return 'An internal error occurred. Please try again later.'
    }
  }
  
  return message
}

// IP address extraction with validation
export function getClientIP(request: NextRequest): string {
  // Try various headers to get the real client IP
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  let ip = cfConnectingIP || xRealIP || (xForwardedFor?.split(',')[0].trim()) || '127.0.0.1'
  
  // Validate IP format
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    ip = '127.0.0.1' // Fallback to localhost if invalid
  }
  
  return ip
}

export default {
  securityHeaders,
  rateLimits,
  sanitizeInput,
  validatePrompt,
  CSRFProtection,
  withSecurity,
  validateApiKey,
  sanitizeErrorMessage,
  getClientIP
}