import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isProtectedAppRoute } from '@/lib/routing'
import { getAdminRoutePrefix, mapAliasToAdminPath, shouldBlockDefaultAdminPath } from '@/lib/admin-route'

function isProtectedPath(pathname: string): boolean {
  return isProtectedAppRoute(pathname)
}

export async function updateSession(request: NextRequest) {
  if (shouldBlockDefaultAdminPath(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 })
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = isProtectedPath(request.nextUrl.pathname)

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  const aliasToAdmin = mapAliasToAdminPath(request.nextUrl.pathname)
  if (aliasToAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = aliasToAdmin
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    return response
  }

  return supabaseResponse
}
