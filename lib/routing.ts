/** Creator studio routes (authenticated). Public profiles live at /creator/[slug]. */
import { getAdminRoutePrefix } from "@/lib/admin-route"

/** First path segment under /creator that belongs to the studio (not a public profile slug). */
export const CREATOR_STUDIO_SEGMENTS = new Set([
  "dashboard",
  "listings",
  "analytics",
  "payouts",
  "upload",
  "revenue",
  "reviews",
  "followers",
])

/** @deprecated Prefer isCreatorStudioRoute — kept for middleware imports */
export const AUTHENTICATED_CREATOR_STUDIO_PREFIXES = [
  "/creator/dashboard",
  "/creator/listings",
  "/creator/analytics",
  "/creator/payouts",
  "/creator/upload",
  "/creator/revenue",
  "/creator/reviews",
  "/creator/followers",
] as const

/** Routes that use AuthenticatedShell — guest Navbar/Footer must not render here. */
export const AUTHENTICATED_ROUTE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/bookmarks",
  "/notifications",
  "/profile",
  "/settings",
  "/explore",
  "/marketplace",
  "/downloads",
  "/collections",
  "/messages",
  "/account",
  "/purchases",
  "/developer",
  "/developers",
  "/architect",
] as const

export function isCreatorStudioRoute(pathname: string): boolean {
  const match = pathname.match(/^\/creator\/([^/]+)/)
  if (!match) return false
  return CREATOR_STUDIO_SEGMENTS.has(match[1])
}

function isAuthenticatedCreatorStudioRoute(pathname: string): boolean {
  return isCreatorStudioRoute(pathname)
}

export function isAuthenticatedAppRoute(pathname: string): boolean {
  if (isAuthenticatedCreatorStudioRoute(pathname)) return true
  const adminPrefix = getAdminRoutePrefix()
  if (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`)) return true
  return AUTHENTICATED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isDeveloperPortalRoute(pathname: string): boolean {
  return pathname === "/developers" || pathname.startsWith("/developers/")
}

export function isUserDashboardRoute(pathname: string): boolean {
  return pathname === "/dashboard"
}

export function isProtectedAppRoute(pathname: string): boolean {
  return isAuthenticatedAppRoute(pathname)
}
