import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'
import { rateLimitManager } from '@/lib/rate-limiting'

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

  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Only apply rate limiting to API routes and specific paths
  const shouldRateLimit = RATE_LIMITED_PATHS.some(path => pathname.startsWith(path))
  
  if (!shouldRateLimit) {
    return NextResponse.next()
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
    
    // Check rate limits
    const rateLimitResult = await rateLimitManager.checkRateLimit(
      userId,
      ip,
      pathname,
      method,
      userAgent
    )

    // Add rate limiting headers to response
    const response = rateLimitResult.allowed 
      ? NextResponse.next()
      : NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: rateLimitResult.reason || 'Too many requests',
            retry_after: rateLimitResult.retry_after
          },
          { 
            status: rateLimitResult.quota_exceeded ? 429 : 429,
            headers: rateLimitResult.headers
          }
        )

    // Add rate limit headers to successful responses too
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Add CORS headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }

    // Track concurrent requests if allowed
    if (rateLimitResult.allowed) {
      await rateLimitManager.startRequest(userId, ip, requestId)
      
      // Store request info for cleanup after response
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-User-ID', userId || '')
      response.headers.set('X-Client-IP', ip)
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    
    // Fail open - allow request but log error
    const response = NextResponse.next()
    response.headers.set('X-Middleware-Error', 'true')
    
    return response
  }
}

function getClientIP(request: NextRequest): string {
  // Try various headers to get the real client IP
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  const xClientIP = request.headers.get('x-client-ip')

  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  if (xRealIP) {
    return xRealIP
  }
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xClientIP) {
    return xClientIP
  }

  // Fallback to a default IP if none found
  return '127.0.0.1'
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