import type { PlanTier } from "@/lib/billing/plans"

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return ""
}

/** Monthly/yearly Stripe Price IDs per plan (with legacy env fallbacks). */
export const STRIPE_PLAN_PRICE_IDS: Record<
  Exclude<PlanTier, "FREE">,
  { monthly: string; yearly: string }
> = {
  PRO: {
    monthly: firstEnv("STRIPE_PRO_MONTHLY_PRICE_ID", "STRIPE_PRO_PRICE_ID"),
    yearly: firstEnv("STRIPE_PRO_YEARLY_PRICE_ID"),
  },
  TEAM: {
    monthly: firstEnv("STRIPE_TEAM_MONTHLY_PRICE_ID"),
    yearly: firstEnv("STRIPE_TEAM_YEARLY_PRICE_ID"),
  },
  ENTERPRISE: {
    monthly: firstEnv(
      "STRIPE_ENTERPRISE_MONTHLY_PRICE_ID",
      "STRIPE_ENTERPRISE_PRICE_ID"
    ),
    yearly: firstEnv("STRIPE_ENTERPRISE_YEARLY_PRICE_ID"),
  },
}

export type StripeSetupStatus = {
  secretKey: boolean
  publishableKey: boolean
  webhookSecret: boolean
  prices: {
    proMonthly: boolean
    teamMonthly: boolean
    enterpriseMonthly: boolean
  }
  readyForCheckout: boolean
  missing: string[]
}

export function getStripeSetupStatus(): StripeSetupStatus {
  const secretKey = Boolean(process.env.STRIPE_SECRET_KEY?.trim())
  const publishableKey = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim())
  const webhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim())

  const prices = {
    proMonthly: Boolean(STRIPE_PLAN_PRICE_IDS.PRO.monthly),
    teamMonthly: Boolean(STRIPE_PLAN_PRICE_IDS.TEAM.monthly),
    enterpriseMonthly: Boolean(STRIPE_PLAN_PRICE_IDS.ENTERPRISE.monthly),
  }

  const missing: string[] = []
  if (!secretKey) missing.push("STRIPE_SECRET_KEY")
  if (!publishableKey) missing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
  if (!webhookSecret) missing.push("STRIPE_WEBHOOK_SECRET")
  if (!prices.proMonthly) {
    missing.push("STRIPE_PRO_MONTHLY_PRICE_ID (or STRIPE_PRO_PRICE_ID)")
  }
  if (!prices.teamMonthly) {
    missing.push("STRIPE_TEAM_MONTHLY_PRICE_ID")
  }
  if (!prices.enterpriseMonthly) {
    missing.push("STRIPE_ENTERPRISE_MONTHLY_PRICE_ID (or STRIPE_ENTERPRISE_PRICE_ID)")
  }

  const readyForCheckout =
    secretKey &&
    publishableKey &&
    prices.proMonthly &&
    prices.teamMonthly &&
    prices.enterpriseMonthly

  return {
    secretKey,
    publishableKey,
    webhookSecret,
    prices,
    readyForCheckout,
    missing,
  }
}

export function getStripePriceId(
  tier: Exclude<PlanTier, "FREE">,
  interval: "monthly" | "yearly"
): string {
  return interval === "yearly"
    ? STRIPE_PLAN_PRICE_IDS[tier].yearly
    : STRIPE_PLAN_PRICE_IDS[tier].monthly
}
