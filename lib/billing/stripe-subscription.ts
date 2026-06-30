import type { SupabaseClient } from "@supabase/supabase-js"
import type { BillingTier } from "@/lib/billing/entitlements"

type SubscriptionSyncInput = {
  userId: string
  tier: BillingTier
  stripeCustomerId?: string | null
  stripeSubscriptionId: string
  stripePriceId?: string | null
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING"
  currentPeriodStart?: Date | null
  currentPeriodEnd?: Date | null
  cancelAtPeriodEnd?: boolean
}

const TIER_ENTITLEMENTS: Record<
  BillingTier,
  {
    max_listings: number
    max_webhooks: number
    max_mcp_servers: number
    max_applications: number
    storage_gb: number
    api_rate_limit: number
  }
> = {
  FREE: {
    max_listings: 3,
    max_webhooks: 1,
    max_mcp_servers: 1,
    max_applications: 1,
    storage_gb: 1,
    api_rate_limit: 100,
  },
  PRO: {
    max_listings: 25,
    max_webhooks: 10,
    max_mcp_servers: 5,
    max_applications: 5,
    storage_gb: 50,
    api_rate_limit: 10_000,
  },
  ENTERPRISE: {
    max_listings: 999_999,
    max_webhooks: 999_999,
    max_mcp_servers: 999_999,
    max_applications: 999_999,
    storage_gb: 500,
    api_rate_limit: 999_999,
  },
}

export async function syncSubscriptionRecord(
  service: SupabaseClient,
  input: SubscriptionSyncInput
) {
  const { data: existing } = await service
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", input.stripeSubscriptionId)
    .maybeSingle()

  const row = {
    user_id: input.userId,
    tier: input.tier,
    status: input.status,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_price_id: input.stripePriceId ?? null,
    current_period_start: input.currentPeriodStart?.toISOString() ?? null,
    current_period_end: input.currentPeriodEnd?.toISOString() ?? null,
    cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    await service.from("subscriptions").update(row).eq("id", existing.id)
  } else {
    await service.from("subscriptions").insert(row)
  }

  if (input.status === "ACTIVE") {
    const limits = TIER_ENTITLEMENTS[input.tier]
    await service.from("feature_entitlements").upsert(
      {
        user_id: input.userId,
        tier: input.tier,
        ...limits,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
  }
}

export function tierFromMetadata(value?: string | null): BillingTier | null {
  const t = value?.toUpperCase()
  if (t === "PRO" || t === "ENTERPRISE" || t === "FREE") return t
  return null
}
