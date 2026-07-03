/**
 * Central entitlement system — single source of truth for plan limits.
 * Never hardcode plan checks outside this file.
 */

import { STRIPE_PLAN_PRICE_IDS } from "@/lib/stripe/config"

export type PlanTier = 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE'

export interface PlanLimits {
  tier: PlanTier
  priceMonthly: number
  priceYearly: number
  apiRateLimit: number      // requests/hour
  storageGb: number
  maxListings: number       // -1 = unlimited
  maxMcpServers: number     // -1 = unlimited
  maxWebhooks: number       // -1 = unlimited
  maxApplications: number   // -1 = unlimited
  maxFeaturedListings: number // -1 = unlimited
  platformFeePct: number    // percentage kept by platform
  canUseAiUpload: boolean
  canUseCustomDomain: boolean
  canVerifyCreator: boolean
  analyticsTier: 'basic' | 'advanced' | 'professional' | 'enterprise'
  supportTier: 'community' | 'email' | 'priority' | 'dedicated'
  payoutSpeed: 'weekly'
  stripePriceIdMonthly: string
  stripePriceIdYearly: string
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    tier: 'FREE',
    priceMonthly: 0,
    priceYearly: 0,
    apiRateLimit: 100,
    storageGb: 1,
    maxListings: -1,
    maxMcpServers: 1,
    maxWebhooks: 1,
    maxApplications: 1,
    maxFeaturedListings: 0,
    platformFeePct: 15,
    canUseAiUpload: false,
    canUseCustomDomain: false,
    canVerifyCreator: false,
    analyticsTier: 'basic',
    supportTier: 'community',
    payoutSpeed: 'weekly',
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
  },
  PRO: {
    tier: 'PRO',
    priceMonthly: 29,
    priceYearly: 290,
    apiRateLimit: 2000,
    storageGb: 100,
    maxListings: -1,
    maxMcpServers: 25,
    maxWebhooks: 50,
    maxApplications: 25,
    maxFeaturedListings: 5,
    platformFeePct: 8,
    canUseAiUpload: true,
    canUseCustomDomain: true,
    canVerifyCreator: true,
    analyticsTier: 'professional',
    supportTier: 'priority',
    payoutSpeed: 'weekly',
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
  },
  TEAM: {
    tier: 'TEAM',
    priceMonthly: 79,
    priceYearly: 790,
    apiRateLimit: 10000,
    storageGb: 500,
    maxListings: -1,
    maxMcpServers: -1,
    maxWebhooks: -1,
    maxApplications: -1,
    maxFeaturedListings: -1,
    platformFeePct: 5,
    canUseAiUpload: true,
    canUseCustomDomain: true,
    canVerifyCreator: true,
    analyticsTier: 'enterprise',
    supportTier: 'dedicated',
    payoutSpeed: 'weekly',
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    priceMonthly: 0,
    priceYearly: 0,
    apiRateLimit: -1,
    storageGb: -1,
    maxListings: -1,
    maxMcpServers: -1,
    maxWebhooks: -1,
    maxApplications: -1,
    maxFeaturedListings: -1,
    platformFeePct: 3,
    canUseAiUpload: true,
    canUseCustomDomain: true,
    canVerifyCreator: true,
    analyticsTier: 'enterprise',
    supportTier: 'dedicated',
    payoutSpeed: 'weekly',
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
  },
}

function withStripePrices(plan: PlanLimits): PlanLimits {
  if (plan.tier === 'FREE') return plan
  const prices = STRIPE_PLAN_PRICE_IDS[plan.tier]
  return {
    ...plan,
    stripePriceIdMonthly: prices.monthly,
    stripePriceIdYearly: prices.yearly,
  }
}

export function getPlanLimits(tier: string | null | undefined): PlanLimits {
  const plan = PLAN_LIMITS[(tier as PlanTier) ?? 'FREE'] ?? PLAN_LIMITS.FREE
  return withStripePrices(plan)
}

export function isUnlimited(value: number): boolean {
  return value === -1
}

export function formatLimit(value: number): string {
  return value === -1 ? 'Unlimited' : value.toLocaleString()
}

/** Check if a user's current count is within their plan limit */
export function isWithinLimit(currentCount: number, limit: number): boolean {
  if (limit === -1) return true
  return currentCount < limit
}

/** Returns available rate limit options for a given plan (cannot exceed plan max) */
export function getRateLimitOptions(tier: string | null | undefined): Array<{ label: string; value: number }> {
  const limits = getPlanLimits(tier)
  const all = [
    { label: '100 / hr', value: 100 },
    { label: '500 / hr', value: 500 },
    { label: '1,000 / hr', value: 1000 },
    { label: '2,000 / hr', value: 2000 },
    { label: '10,000 / hr', value: 10000 },
  ]
  return all.filter(o => o.value <= limits.apiRateLimit)
}

/** Feature gate helper — returns { allowed, reason } */
export function checkFeatureAccess(
  feature: keyof PlanLimits,
  tier: string | null | undefined
): { allowed: boolean; requiredTier?: PlanTier } {
  const limits = getPlanLimits(tier)
  const value = limits[feature]

  if (typeof value === 'boolean') {
    if (value) return { allowed: true }
    // Find minimum tier that enables it
    for (const t of ['PRO', 'TEAM', 'ENTERPRISE'] as PlanTier[]) {
      if (PLAN_LIMITS[t][feature] === true) {
        return { allowed: false, requiredTier: t }
      }
    }
    return { allowed: false }
  }

  if (typeof value === 'number') {
    return { allowed: value !== 0 }
  }

  return { allowed: true }
}

export const PLAN_ORDER: PlanTier[] = ['FREE', 'PRO', 'TEAM', 'ENTERPRISE']

export function isPlanAtLeast(userTier: string | null | undefined, requiredTier: PlanTier): boolean {
  const userIdx = PLAN_ORDER.indexOf((userTier as PlanTier) ?? 'FREE')
  const reqIdx = PLAN_ORDER.indexOf(requiredTier)
  return userIdx >= reqIdx
}

/** Check if user can create more of a resource based on their plan limit */
export function canCreateResource(
  currentCount: number,
  limit: number
): { allowed: boolean; reason?: string } {
  if (limit === -1) return { allowed: true }
  if (currentCount >= limit) {
    return { 
      allowed: false, 
      reason: `You have reached your plan limit of ${limit} items. Upgrade to create more.` 
    }
  }
  return { allowed: true }
}
