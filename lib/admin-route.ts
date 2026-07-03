const DEFAULT_ADMIN_PREFIX = "/felon-admin"
const INTERNAL_ADMIN_PREFIX = "/admin"

function normalizePrefix(value: string | undefined): string {
  if (!value) return DEFAULT_ADMIN_PREFIX
  const trimmed = value.trim().replace(/^["']|["']$/g, "")
  if (!trimmed) return DEFAULT_ADMIN_PREFIX
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return withLeadingSlash.replace(/\/+$/, "")
}

export function getAdminRoutePrefix(): string {
  return normalizePrefix(
    process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX ??
      process.env.ADMIN_ROUTE_PREFIX ??
      process.env.ADMIN_ROUTE
  )
}

export function isAdminAliasEnabled(): boolean {
  return getAdminRoutePrefix() !== INTERNAL_ADMIN_PREFIX
}

export function isDefaultAdminPath(pathname: string): boolean {
  return pathname === INTERNAL_ADMIN_PREFIX || pathname.startsWith(`${INTERNAL_ADMIN_PREFIX}/`)
}

/** When the public admin prefix is not the internal /admin route, block direct /admin URLs (404). */
export function shouldBlockDefaultAdminPath(pathname: string): boolean {
  return isAdminAliasEnabled() && isDefaultAdminPath(pathname)
}

export function mapAliasToAdminPath(pathname: string): string | null {
  const prefix = getAdminRoutePrefix()
  if (prefix === INTERNAL_ADMIN_PREFIX) return null
  if (pathname === prefix) return `${INTERNAL_ADMIN_PREFIX}/dashboard`
  if (pathname.startsWith(`${prefix}/`)) {
    return `${INTERNAL_ADMIN_PREFIX}${pathname.slice(prefix.length)}`
  }
  return null
}

