import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simplified security headers (compatible with Edge Runtime)
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

// Paths that should be excluded from middleware
const EXCLUDED_PATHS = [
  '/api/health',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/sw.js',
  '/public'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Create response with security headers
  const response = NextResponse.next()

  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // Add request ID for tracking (using crypto.randomUUID() which is available in Edge Runtime)
  try {
    const requestId = crypto.randomUUID()
    response.headers.set('X-Request-ID', requestId)
  } catch (error) {
    // crypto.randomUUID not available, skip
  }

  return response
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