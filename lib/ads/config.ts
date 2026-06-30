import { getAdminRoutePrefix } from "@/lib/admin-route"
import type { BillingTier } from "@/lib/billing/entitlements"

export type AdPlacement = "footer" | "inline" | "sidebar" | "banner"

function normalizeAdSenseClientId(value?: string | null): string | null {
  if (!value) return null

  const cleaned = value.trim().replace(/^['\"]|['\"]$/g, "")
  if (!cleaned) return null

  if (cleaned.startsWith("ca-pub-")) {
    return cleaned
  }

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      const url = new URL(cleaned)
      const client = url.searchParams.get("client")
      if (client?.startsWith("ca-pub-")) {
        return client
      }
    } catch {
      // fall through to generic parsing
    }
  }

  const clientMatch = cleaned.match(/client=(ca-pub-[A-Za-z0-9_-]+)/)
  if (clientMatch?.[1]) {
    return clientMatch[1]
  }

  return null
}

/** AdSense client ID (ca-pub-…) — required for web ads. */
export function getAdSenseClientId(): string | null {
  return (
    normalizeAdSenseClientId(process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID) ||
    normalizeAdSenseClientId(process.env.NEXT_PUBLIC_ADS_CLIENT_ID) ||
    normalizeAdSenseClientId(process.env.NEXT_PUBLIC_ADMOB_PUBLISHER_ID)
  )
}

export function isAdsConfigured(): boolean {
  return Boolean(getAdSenseClientId())
}

export function tierShowsAds(tier: BillingTier): boolean {
  return tier === "FREE"
}

export function getAdSlotId(placement: AdPlacement): string | undefined {
  const map: Record<AdPlacement, string | undefined> = {
    footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
    inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE,
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
    banner: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER,
  }
  const slot = map[placement]?.trim()
  return slot || undefined
}

export function isAdExcludedRoute(pathname: string): boolean {
  if (!pathname) return true
  if (pathname.startsWith("/auth")) return true

  const adminPrefix = getAdminRoutePrefix()
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true
  if (adminPrefix !== "/admin" && (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`))) {
    return true
  }

  return false
}
