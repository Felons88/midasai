import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimitMiddleware } from '@/lib/rate-limit-middleware'
import { getSecurityHeaders } from '@/lib/security/headers'

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes only
  if (request.nextUrl.pathname.startsWith('/api')) {
    const type = request.nextUrl.pathname.startsWith('/api/auth') ? 'auth' : 'api'
    const rateLimitResult = await rateLimitMiddleware(request, type)
    
    if (rateLimitResult) {
      return rateLimitResult
    }
  }
  
  const response = await updateSession(request)
  
  // If response is a redirect (unauthenticated), return it
  if (response.status === 307 || response.status === 302) {
    return response
  }
  
  // Add security headers to all responses
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add CSRF protection headers for state-changing requests
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    response.headers.set('X-CSRF-Protection', '1; mode=strict')
  }
  
  const path = request.nextUrl.pathname
  const adminSecretRoute = process.env.ADMIN_SECRET_ROUTE
  
  // If ADMIN_SECRET_ROUTE is set, require it to access admin routes
  if (adminSecretRoute && path.startsWith('/admin')) {
    const secret = request.nextUrl.searchParams.get('secret')
    const secretHeader = request.headers.get('x-admin-secret')
    
    if (secret !== adminSecretRoute && secretHeader !== adminSecretRoute) {
      return NextResponse.redirect(new URL('/404', request.url))
    }
  }
  
  // Auto-redirect authenticated users from marketing pages to dashboard
  const marketingRoutes = ['/', '/explore', '/categories', '/search', '/skills', '/workflows', 'mcp', '/agents', '/plugins', '/prompts', '/templates', '/api-docs', '/about', '/blog', '/pricing', '/contact', '/faq', '/docs']
  const isMarketingRoute = marketingRoutes.some(route => path === route || path.startsWith(route + '/'))
  
  if (isMarketingRoute) {
    // Check if user is authenticated by looking for the session cookie
    const hasSession = request.cookies.get('sb-access-token') || request.cookies.get('sb-refresh-token')
    
    if (hasSession) {
      // User is authenticated, redirect to dashboard
      // We'll let the dashboard page handle role-based routing
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
