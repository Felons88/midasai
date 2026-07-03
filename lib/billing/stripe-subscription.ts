import type { SupabaseClient } from "@supabase/supabase-js"
import type { BillingTier } from "@/lib/billing/entitlements"
import { createCreditService } from "@/lib/billing/credits"

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
    const { data: plan } = await service
      .from("plan_definitions")
      .select("id")
      .eq("tier", input.tier)
      .single()

    const { data: features } = await service
      .from("plan_features")
      .select("feature_key, limit_value")
      .eq("plan_id", plan?.id ?? "")

    const limits: Record<string, number | null> = {}
    for (const f of features ?? []) {
      limits[f.feature_key] = f.limit_value
    }

    const plan_id = plan?.id ?? null
    await service.from("feature_entitlements").upsert(
      {
        user_id: input.userId,
        tier: input.tier,
        plan_id,
        max_listings: limits["listings"] ?? -1,
        max_webhooks: limits["webhooks"] ?? 1,
        max_mcp_servers: limits["mcp_servers"] ?? 1,
        max_applications: limits["applications"] ?? 1,
        storage_gb: limits["storage_gb"] ?? 1,
        api_rate_limit: limits["api_rate_limit"] ?? 100,
        max_featured_listings: limits["featured_listings"] ?? 0,
        platform_fee_pct: limits["platform_fee_pct"] ?? 15,
        can_use_ai_upload: Boolean(limits["ai_upload"]),
        can_use_custom_domain: Boolean(limits["custom_domain"]),
        can_verify_creator: Boolean(limits["creator_verification"]),
        analytics_tier: String(limits["analytics_tier"] ?? "basic"),
        support_tier: String(limits["support_tier"] ?? "community"),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    // Allocate monthly AI credits based on plan
    const creditService = createCreditService(service)
    const creditPolicy = {
      FREE: { monthlyCap: 600, dailyAllowance: 150 },
      PRO: { monthlyCap: 1000, dailyAllowance: 500 },
      TEAM: { monthlyCap: 5000, dailyAllowance: 2000 },
      ENTERPRISE: { monthlyCap: 50_000, dailyAllowance: 10_000 },
    }[input.tier] ?? { monthlyCap: 600, dailyAllowance: 150 }

    await creditService.allocateMonthlyCredits(
      { userId: input.userId },
      creditPolicy.monthlyCap,
      creditPolicy.dailyAllowance
    )
  }
}

export function tierFromMetadata(value?: string | null): BillingTier | null {
  const t = value?.toUpperCase()
  if (t === "PRO" || t === "TEAM" || t === "ENTERPRISE" || t === "FREE") return t
  return null
}
