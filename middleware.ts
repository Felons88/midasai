import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { rateLimitMiddleware } from "@/lib/rate-limit-middleware"
import { getSecurityHeaders } from "@/lib/security/headers"
import {
  getSubdomain,
  resolveSubdomainRewrite,
  shouldSkipMarketingRedirect,
} from "@/lib/subdomains"
import { getAuthLoginUrl, getAuthLoginUrlForHost } from "@/lib/site-url"

function applySecurityHeaders(response: NextResponse) {
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")
  const subdomain = getSubdomain(host)
  const path = request.nextUrl.pathname

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", path)
  if (subdomain) {
    requestHeaders.set("x-midas-subdomain", subdomain)
  }

  const rewritePath = resolveSubdomainRewrite(subdomain, path)
  const effectivePath = rewritePath && rewritePath !== path ? rewritePath : path
  requestHeaders.set("x-pathname", effectivePath)
  if (rewritePath && rewritePath !== path) {
    requestHeaders.set("x-invoke-path", rewritePath)
  }

  if (rewritePath && rewritePath !== path) {
    const url = request.nextUrl.clone()
    url.pathname = rewritePath

    const sessionUrl = request.nextUrl.clone()
    sessionUrl.pathname = rewritePath
    const sessionRequest = new NextRequest(sessionUrl, request)
    const sessionResponse = await updateSession(sessionRequest)

    if (sessionResponse.status === 307 || sessionResponse.status === 302) {
      const loginUrl = subdomain
        ? getAuthLoginUrlForHost(host, "/")
        : getAuthLoginUrl(effectivePath)
      const redirectResponse = NextResponse.redirect(loginUrl)
      sessionResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return applySecurityHeaders(redirectResponse)
    }

    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    sessionResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    return applySecurityHeaders(response)
  }

  const isPublicApiRoute =
    path.startsWith("/v1/") || path.startsWith("/api/v1/")

  if (!isPublicApiRoute && (path.startsWith("/api") || path.startsWith("/v1/"))) {
    const type = path.startsWith("/api/auth") ? "auth" : "api"
    const rateLimitResult = await rateLimitMiddleware(request, type)

    if (rateLimitResult) {
      return rateLimitResult
    }
  }

  if (isPublicApiRoute) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    return applySecurityHeaders(response)
  }

  const response = await updateSession(request)

  if (response.status === 307 || response.status === 302) {
    return response
  }

  applySecurityHeaders(response)

  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    response.headers.set("X-CSRF-Protection", "1; mode=strict")
  }

  const adminSecretRoute = process.env.ADMIN_SECRET_ROUTE

  if (adminSecretRoute && path.startsWith("/admin")) {
    const secret = request.nextUrl.searchParams.get("secret")
    const secretHeader = request.headers.get("x-admin-secret")

    if (secret !== adminSecretRoute && secretHeader !== adminSecretRoute) {
      return NextResponse.redirect(new URL("/404", request.url))
    }
  }

  if (path === "/skills" || path.startsWith("/skills/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/explore"
    url.searchParams.set("type", "SKILL")
    return NextResponse.redirect(url)
  }

  if (path === "/marketplace" || path.startsWith("/marketplace/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/explore"
    return NextResponse.redirect(url)
  }

  if (path === "/" && !shouldSkipMarketingRedirect(subdomain, path)) {
    const hasSession =
      request.cookies.get("sb-access-token") || request.cookies.get("sb-refresh-token")

    if (hasSession) {
      return NextResponse.redirect(new URL("/explore", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
