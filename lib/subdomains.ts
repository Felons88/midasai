export type MidasSubdomain = "api" | "docs" | "developer" | "creator"

export const SUBDOMAIN_HOSTS = {
  api: "api.midasai.tech",
  docs: "docs.midasai.tech",
  developer: "developer.midasai.tech",
  creator: "creator.midasai.tech",
} as const

/** Paths shared across all hosts — never prefix with subdomain segment. */
const PASSTHROUGH_PREFIXES = [
  "/auth",
  "/api",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
] as const

export function shouldPassthroughSubdomainPath(pathname: string): boolean {
  const path = pathname || "/"
  return PASSTHROUGH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  )
}

export function getSubdomain(host: string | null): MidasSubdomain | null {
  if (!host) return null
  const hostname = host.split(":")[0].toLowerCase()

  if (hostname === SUBDOMAIN_HOSTS.api || hostname.startsWith("api.")) return "api"
  if (hostname === SUBDOMAIN_HOSTS.docs || hostname.startsWith("docs.")) return "docs"
  if (hostname === SUBDOMAIN_HOSTS.developer || hostname.startsWith("developer."))
    return "developer"
  if (hostname === SUBDOMAIN_HOSTS.creator || hostname.startsWith("creator.")) return "creator"
  return null
}

/** Rewrite subdomain paths to internal App Router paths. */
export function resolveSubdomainRewrite(
  subdomain: MidasSubdomain | null,
  pathname: string
): string | null {
  if (!subdomain) return null
  if (shouldPassthroughSubdomainPath(pathname)) return null

  const path = pathname || "/"

  switch (subdomain) {
    case "api":
      if (path === "/" || path === "") return "/v1"
      if (path.startsWith("/v1") || path.startsWith("/api/")) return null
      return `/v1${path}`
    case "docs":
      if (path === "/" || path === "") return "/api-docs"
      if (path.startsWith("/api-docs")) return null
      return `/api-docs${path}`
    case "developer":
      if (path === "/" || path === "") return "/developer"
      if (path.startsWith("/developer")) return null
      return `/developer${path}`
    case "creator":
      if (path === "/" || path === "") return "/creator/dashboard"
      if (path.startsWith("/creator")) return null
      return `/creator${path}`
    default:
      return null
  }
}

export function shouldSkipMarketingRedirect(
  subdomain: MidasSubdomain | null,
  pathname: string
): boolean {
  if (subdomain === "docs" || subdomain === "api") return true
  if (subdomain === "developer" || subdomain === "creator") return true
  return pathname === "/api-docs" || pathname.startsWith("/api-docs/")
}

export function isDocsExperience(
  subdomain: MidasSubdomain | null,
  pathname: string
): boolean {
  return subdomain === "docs" || pathname.startsWith("/api-docs")
}
