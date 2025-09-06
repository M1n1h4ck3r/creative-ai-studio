import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Routes that require authentication
  const protectedRoutes = ['/dashboard', '/history', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Allow API routes and static files to pass through
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return res
  }

  // Check if this is a protected route
  if (isProtectedRoute) {
    try {
      // Get access token from cookies
      const accessToken = request.cookies.get('sb-access-token')?.value ||
                         request.cookies.get('supabase-auth-token')?.value

      if (!accessToken) {
        // No token, redirect to auth
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
      }

      // Create Supabase client for server-side
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      })
      
      // Verify the token by getting user
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      
      if (!user || error) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
      }
      
      return res
    } catch (error) {
      // If there's an error checking auth, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}