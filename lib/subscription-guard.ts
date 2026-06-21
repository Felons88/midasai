/**
 * SubscriptionGuard — server-side plan enforcement.
 * Every resource creation MUST pass through checkLimit() before executing.
 * Frontend restrictions alone are insufficient; this is the authoritative gate.
 */

import { createClient } from "@/lib/supabase/server"
import { getPlanLimits, PLAN_LIMITS, PlanTier } from "@/lib/subscriptions"

export type GuardedResource =
  | "webhooks"
  | "api_keys"
  | "mcp_servers"
  | "listings"
  | "applications"

const RESOURCE_LIMIT_KEY: Record<GuardedResource, keyof ReturnType<typeof getPlanLimits>> = {
  webhooks:     "maxWebhooks",
  api_keys:     "maxApplications", // API keys share the applications limit slot
  mcp_servers:  "maxMcpServers",
  listings:     "maxListings",
  applications: "maxApplications",
}

const RESOURCE_DB_TABLE: Record<GuardedResource, string> = {
  webhooks:     "webhooks",
  api_keys:     "api_keys",
  mcp_servers:  "mcp_servers",
  listings:     "listings",
  applications: "applications",
}

export interface LimitCheckResult {
  allowed: boolean
  currentCount: number
  limit: number
  tier: PlanTier
  upgradeRequired?: PlanTier
}

/**
 * Check whether the authenticated user can create one more of `resource`.
 * Returns { allowed: false } if they are at or over their plan limit.
 */
export async function checkLimit(
  userId: string,
  resource: GuardedResource
): Promise<LimitCheckResult> {
  const supabase = await createClient()

  // Fetch tier from subscriptions table (source of truth)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle()

  const tier = (sub?.tier as PlanTier) ?? "FREE"
  const limits = getPlanLimits(tier)
  const limitKey = RESOURCE_LIMIT_KEY[resource]
  const limit = limits[limitKey] as number

  // Count existing records for this user
  const table = RESOURCE_DB_TABLE[resource]
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  const currentCount = count ?? 0

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, currentCount, limit, tier }
  }

  if (currentCount >= limit) {
    // Find next tier that raises this limit
    const upgradeRequired = findUpgradeTier(tier, limitKey as string, limit)
    return { allowed: false, currentCount, limit, tier, upgradeRequired }
  }

  return { allowed: true, currentCount, limit, tier }
}

function findUpgradeTier(
  currentTier: PlanTier,
  limitKey: string,
  currentLimit: number
): PlanTier | undefined {
  const order: PlanTier[] = ["FREE", "STARTER", "PRO", "BUSINESS"]
  const idx = order.indexOf(currentTier)
  for (let i = idx + 1; i < order.length; i++) {
    const t = order[i]
    const val = (PLAN_LIMITS[t] as any)[limitKey] as number
    if (val === -1 || val > currentLimit) return t
  }
  return undefined
}

/**
 * Convenience: throws a structured 403 Response if limit is exceeded.
 * Use inside API route handlers.
 */
export async function enforceLimit(
  userId: string,
  resource: GuardedResource
): Promise<LimitCheckResult> {
  const result = await checkLimit(userId, resource)
  if (!result.allowed) {
    throw new LimitExceededError(result)
  }
  return result
}

export class LimitExceededError extends Error {
  constructor(public readonly result: LimitCheckResult) {
    super(
      `Plan limit reached: ${result.currentCount}/${result.limit} ${result.upgradeRequired ? `— upgrade to ${result.upgradeRequired}` : ""}`
    )
    this.name = "LimitExceededError"
  }
}
