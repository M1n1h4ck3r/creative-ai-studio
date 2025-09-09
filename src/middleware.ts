import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'
import { securityHeaders, getClientIP, CSRFProtection } from '@/lib/security'

// Rate limiting configuration
const RATE_LIMITED_PATHS = [
  '/api/generate',
  '/api/estimate-cost',
  '/api/backup',
  '/api/notifications',
  '/api/templates',
  '/api/projects'
]

const EXCLUDED_PATHS = [
  '/api/health',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/sw.js'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || undefined

  // Create response with security headers
  const response = NextResponse.next()
  
  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return response
  }

  // Only apply rate limiting to API routes and specific paths
  const shouldRateLimit = RATE_LIMITED_PATHS.some(path => pathname.startsWith(path))
  
  // CSRF protection for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && pathname.startsWith('/api/')) {
    const csrfToken = request.headers.get('x-csrf-token')
    const sessionId = request.cookies.get('session-id')?.value
    
    // Skip CSRF check for auth endpoints (they have their own protection)
    if (!pathname.startsWith('/api/auth/') && sessionId && csrfToken) {
      if (!CSRFProtection.verifyToken(sessionId, csrfToken)) {
        return NextResponse.json(
          { error: 'Invalid or missing CSRF token' },
          { status: 403, headers: response.headers }
        )
      }
    }
  }

  if (!shouldRateLimit) {
    return response
  }

  try {
    // Get user ID from auth token if available
    let userId: string | null = null
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    } catch (authError) {
      // Continue without user ID if auth fails
      console.warn('Auth check failed in middleware:', authError)
    }

    // Generate unique request ID for concurrent request tracking
    const requestId = crypto.randomUUID()
    
    // Simple rate limiting implementation
    const rateLimitResult = await checkSimpleRateLimit(ip, pathname)
    
    async function checkSimpleRateLimit(ip: string, path: string) {
      // Basic rate limiting - allow all for now
      // In production, implement Redis-based rate limiting
      return { 
        allowed: true, 
        remaining: 100,
        reset_time: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': Math.floor((Date.now() + 60000) / 1000).toString()
        }
      }
    }

    // Handle rate limiting response
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests',
          retry_after: 60
        },
        { status: 429 }
      )
      
      // Add security headers to rate limit response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value)
      })
      
      // Add rate limit headers
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value)
      })
      
      return rateLimitResponse
    }

    // Add rate limit headers to successful responses
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }

    // Add request tracking headers if allowed
    if (rateLimitResult.allowed) {
      // Store request info in headers
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-User-ID', userId || '')
      response.headers.set('X-Client-IP', ip)
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    
    // Fail open - allow request but log error
    const errorResponse = NextResponse.next()
    
    // Add security headers even on error
    Object.entries(securityHeaders).forEach(([key, value]) => {
      errorResponse.headers.set(key, value)
    })
    
    errorResponse.headers.set('X-Middleware-Error', 'true')
    
    return errorResponse
  }
}


// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}