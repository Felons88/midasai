import type { SupabaseClient } from "@supabase/supabase-js"
import { getResolvedPlan, type PlanTier, type FeatureKey } from "@/lib/billing/plans"

export type BillingTier = PlanTier

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

function monthStartIso() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export function isValidBillingTier(value: string | null | undefined): value is BillingTier {
  const tier = value?.toUpperCase()
  return tier === "FREE" || tier === "PRO" || tier === "TEAM" || tier === "ENTERPRISE"
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

  if (entitlement?.tier && isValidBillingTier(entitlement.tier)) {
    return entitlement.tier
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .in("status", ["ACTIVE", "TRIALING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subscription?.tier && isValidBillingTier(subscription.tier)) {
    return subscription.tier
  }

  return "FREE"
}

export async function resolveOrganizationTier(
  supabase: SupabaseClient,
  organizationId: string
): Promise<BillingTier> {
  const { data: org } = await supabase
    .from("organizations")
    .select("plan_id, plan_definitions!inner(tier)")
    .eq("id", organizationId)
    .maybeSingle()

  const definitions = org?.plan_definitions as { tier: string } | { tier: string }[] | null | undefined
  const tier = Array.isArray(definitions) ? definitions[0]?.tier : definitions?.tier
  if (tier && isValidBillingTier(tier)) return tier

  return "FREE"
}

export async function getBillingContext(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingContext> {
  const tier = await resolveUserTier(supabase, userId)
  const plan = await getResolvedPlan(supabase, tier)

  const feature = (key: FeatureKey): number | null => {
    if (!plan) return null
    const f = plan.features[key]
    if (!f || !f.enabled) return null
    return f.limitValue ?? null
  }

  const limits: BillingLimits = {
    tier,
    maxListings: feature("listings") ?? -1,
    maxWebhooks: feature("webhooks") ?? 1,
    maxApiKeys: feature("api_keys") ?? 2,
    maxMcpServers: feature("mcp_servers") ?? 1,
    maxApplications: feature("applications") ?? 1,
    maxDownloadsPerMonth: feature("downloads_monthly") ?? 10,
    storageGb: feature("storage_gb") ?? 1,
    apiRateLimit: feature("api_rate_limit") ?? 100,
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

export async function checkFeature(
  supabase: SupabaseClient,
  userId: string,
  featureKey: FeatureKey
): Promise<{ allowed: boolean; limit: number | null; used: number; message?: string }> {
  const tier = await resolveUserTier(supabase, userId)
  const plan = await getResolvedPlan(supabase, tier)

  const feature = plan?.features[featureKey]
  if (!feature || !feature.enabled) {
    return { allowed: false, limit: null, used: 0, message: "Feature not available on your plan" }
  }

  const limit = feature.limitValue ?? null
  if (limit === -1 || limit === null) {
    return { allowed: true, limit, used: 0 }
  }

  const context = await getBillingContext(supabase, userId)
  const usage = context.usage

  const usedMap: Record<string, number> = {
    listings: usage.listings,
    webhooks: usage.webhooks,
    api_keys: usage.apiKeys,
    mcp_servers: usage.mcpServers,
    applications: usage.applications,
    downloads_monthly: usage.downloadsThisMonth,
  }
  const used = usedMap[featureKey] ?? 0

  const allowed = limit === -1 || used < limit
  return {
    allowed,
    limit,
    used,
    message: allowed ? undefined : `${featureKey} limit reached (${limit}). Upgrade your plan.`,
  }
}
