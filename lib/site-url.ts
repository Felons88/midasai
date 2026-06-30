/** Canonical production site origin (no trailing slash). */
export const PRODUCTION_SITE_URL = "https://midasai.tech"

/** Public REST API origin (no trailing slash). */
export const PRODUCTION_API_URL = "https://api.midasai.tech"

export const PRODUCTION_DOCS_URL = "https://docs.midasai.tech"
export const PRODUCTION_DEVELOPER_URL = "https://developer.midasai.tech"
export const PRODUCTION_CREATOR_URL = "https://creator.midasai.tech"

export function getApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
    PRODUCTION_API_URL
  )
}

export function getDocsUrl(): string {
  return (
    process.env.NEXT_PUBLIC_DOCS_URL?.trim().replace(/\/$/, "") ||
    PRODUCTION_DOCS_URL
  )
}

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    PRODUCTION_SITE_URL
  )
}

export function getAuthLoginUrl(redirectTarget = "/explore"): string {
  const base = getSiteUrl()
  const redirect = redirectTarget.startsWith("http")
    ? redirectTarget
    : `${base}${redirectTarget.startsWith("/") ? redirectTarget : `/${redirectTarget}`}`
  return `${base}/auth/login?redirect=${encodeURIComponent(redirect)}`
}

export function getAuthLoginUrlForHost(host: string | null, redirectPath = "/"): string {
  const siteBase = getSiteUrl()
  const protocol = siteBase.startsWith("https") ? "https" : "http"
  const fullOrigin = host ? `${protocol}://${host}` : siteBase
  const redirect = `${fullOrigin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`
  return `${siteBase}/auth/login?redirect=${encodeURIComponent(redirect)}`
}
