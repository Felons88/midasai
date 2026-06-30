import type { SupabaseClient } from "@supabase/supabase-js"
import { SUBSCRIPTION_TIERS } from "@/lib/monetization"

export type BillingTier = "FREE" | "PRO" | "ENTERPRISE"

export type BillingLimits = {
  tier: BillingTier
  maxListings: number
  maxWebhooks: number
  maxApiKeys: number
  maxMcpServers: number
  maxApplications: number
  maxDownloadsPerMonth: number
  storageGb: number
  apiRateLimit: number
}

export type BillingUsage = {
  listings: number
  webhooks: number
  apiKeys: number
  mcpServers: number
  applications: number
  downloadsThisMonth: number
}

export type BillingContext = {
  limits: BillingLimits
  usage: BillingUsage
}

const API_KEY_LIMITS: Record<BillingTier, number> = {
  FREE: 2,
  PRO: 10,
  ENTERPRISE: -1,
}

const TIER_DEFAULT_LIMITS: Record<
  BillingTier,
  Omit<BillingLimits, "tier" | "maxDownloadsPerMonth">
> = {
  FREE: {
    maxListings: -1,
    maxWebhooks: 1,
    maxApiKeys: 2,
    maxMcpServers: 1,
    maxApplications: 1,
    storageGb: 1,
    apiRateLimit: 100,
  },
  PRO: {
    maxListings: 25,
    maxWebhooks: 10,
    maxApiKeys: 10,
    maxMcpServers: 5,
    maxApplications: 5,
    storageGb: 50,
    apiRateLimit: 10_000,
  },
  ENTERPRISE: {
    maxListings: -1,
    maxWebhooks: -1,
    maxApiKeys: -1,
    maxMcpServers: -1,
    maxApplications: -1,
    storageGb: 500,
    apiRateLimit: -1,
  },
}

function monthStartIso() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export async function resolveUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingTier> {
  const { data: entitlement } = await supabase
    .from("feature_entitlements")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle()

  if (entitlement?.tier) {
    const t = entitlement.tier.toUpperCase()
    if (t === "PRO" || t === "ENTERPRISE" || t === "FREE") return t
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .in("status", ["ACTIVE", "TRIALING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subscription?.tier) {
    const t = subscription.tier as BillingTier
    if (t === "PRO" || t === "ENTERPRISE") return t
  }

  return "FREE"
}

export async function getBillingContext(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingContext> {
  const tier = await resolveUserTier(supabase, userId)

  const { data: entitlement } = await supabase
    .from("feature_entitlements")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  const defaults = TIER_DEFAULT_LIMITS[tier]
  const tierDownloads =
    SUBSCRIPTION_TIERS.find((t) => t.tier === tier)?.limits.downloads ?? 10

  const limits: BillingLimits = {
    tier,
    maxListings: entitlement?.max_listings ?? defaults.maxListings,
    maxWebhooks: entitlement?.max_webhooks ?? defaults.maxWebhooks,
    maxApiKeys: API_KEY_LIMITS[tier],
    maxMcpServers: entitlement?.max_mcp_servers ?? defaults.maxMcpServers,
    maxApplications: entitlement?.max_applications ?? defaults.maxApplications,
    maxDownloadsPerMonth: tierDownloads,
    storageGb: entitlement?.storage_gb ?? defaults.storageGb,
    apiRateLimit: entitlement?.api_rate_limit ?? defaults.apiRateLimit,
  }

  const monthStart = monthStartIso()

  const [
    listingsRes,
    webhooksRes,
    apiKeysRes,
    mcpRes,
    appsRes,
    downloadsRes,
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", userId),
    supabase
      .from("webhooks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "ACTIVE"),
    supabase
      .from("api_keys")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "ACTIVE"),
    supabase
      .from("mcp_connections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("downloads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart),
  ])

  const usage: BillingUsage = {
    listings: listingsRes.count ?? 0,
    webhooks: webhooksRes.count ?? 0,
    apiKeys: apiKeysRes.count ?? 0,
    mcpServers: mcpRes.count ?? 0,
    applications: appsRes.count ?? 0,
    downloadsThisMonth: downloadsRes.count ?? 0,
  }

  return { limits, usage }
}

export type LimitResource =
  | "listings"
  | "webhooks"
  | "api_keys"
  | "mcp_servers"
  | "applications"
  | "downloads_monthly"

export function checkBillingLimit(
  context: BillingContext,
  resource: LimitResource
): { allowed: boolean; message?: string; code?: string } {
  const { limits, usage } = context

  const within = (current: number, max: number) => max === -1 || current < max

  switch (resource) {
    case "listings":
      if (!within(usage.listings, limits.maxListings)) {
        return {
          allowed: false,
          code: "LISTING_LIMIT",
          message: `Listing limit reached (${limits.maxListings}). Upgrade your plan to publish more.`,
        }
      }
      break
    case "webhooks":
      if (!within(usage.webhooks, limits.maxWebhooks)) {
        return {
          allowed: false,
          code: "WEBHOOK_LIMIT",
          message: `Webhook limit reached (${limits.maxWebhooks}). Upgrade to add more webhooks.`,
        }
      }
      break
    case "api_keys":
      if (!within(usage.apiKeys, limits.maxApiKeys)) {
        return {
          allowed: false,
          code: "API_KEY_LIMIT",
          message: `API key limit reached (${limits.maxApiKeys}). Upgrade your developer plan.`,
        }
      }
      break
    case "mcp_servers":
      if (!within(usage.mcpServers, limits.maxMcpServers)) {
        return {
          allowed: false,
          code: "MCP_LIMIT",
          message: `MCP connection limit reached (${limits.maxMcpServers}).`,
        }
      }
      break
    case "applications":
      if (!within(usage.applications, limits.maxApplications)) {
        return {
          allowed: false,
          code: "APPLICATION_LIMIT",
          message: `Application limit reached (${limits.maxApplications}).`,
        }
      }
      break
    case "downloads_monthly":
      if (!within(usage.downloadsThisMonth, limits.maxDownloadsPerMonth)) {
        return {
          allowed: false,
          code: "DOWNLOAD_LIMIT",
          message: `Monthly download limit reached (${limits.maxDownloadsPerMonth}). Upgrade for unlimited downloads.`,
        }
      }
      break
  }

  return { allowed: true }
}
