import { PRODUCTION_API_URL, getSiteUrl } from "@/lib/site-url"

/** Public REST API base URL (no trailing slash). Used in docs and developer UI. */
export function getPublicApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "")
  if (explicit) return explicit

  return PRODUCTION_API_URL
}

export function getPublicAppBaseUrl(): string {
  return getSiteUrl()
}
