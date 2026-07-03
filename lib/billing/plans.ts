/**
 * Database-driven plan configuration.
 * Central source of truth for tiers, pricing, and feature limits.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export type PlanTier = "FREE" | "PRO" | "TEAM" | "ENTERPRISE"

export const PLAN_TIERS: PlanTier[] = ["FREE", "PRO", "TEAM", "ENTERPRISE"]

export interface PlanDefinition {
  id: string
  tier: PlanTier
  name: string
  priceMonthly: number
  priceYearly: number
  currency: string
  isActive: boolean
  metadata: Record<string, unknown>
}

export interface PlanFeature {
  id: string
  planId: string
  featureKey: string
  enabled: boolean
  limitValue: number | null
  metadata: Record<string, unknown>
}

export interface ResolvedPlan {
  tier: PlanTier
  name: string
  priceMonthly: number
  priceYearly: number
  currency: string
  features: Record<string, PlanFeature>
}

export const FEATURE_KEYS = [
  "ai_chat",
  "ai_architect",
  "ai_workflow",
  "ai_search",
  "ai_upload",
  "listings",
  "webhooks",
  "api_keys",
  "mcp_servers",
  "applications",
  "downloads_monthly",
  "storage_gb",
  "api_rate_limit",
  "featured_listings",
  "creator_verification",
  "custom_domain",
  "analytics_tier",
  "support_tier",
  "platform_fee_pct",
  "team_members",
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]

export function isValidPlanTier(value: string | null | undefined): value is PlanTier {
  return Boolean(value && PLAN_TIERS.includes(value as PlanTier))
}

export function normalizePlanTier(value: string | null | undefined): PlanTier {
  const upper = value?.toUpperCase() as PlanTier
  return isValidPlanTier(upper) ? upper : "FREE"
}

export async function getPlanDefinitions(
  supabase: SupabaseClient
): Promise<PlanDefinition[]> {
  const { data, error } = await supabase
    .from("plan_definitions")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true })

  if (error) {
    console.error("[plans] getPlanDefinitions error:", error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    tier: row.tier as PlanTier,
    name: row.name,
    priceMonthly: row.price_monthly,
    priceYearly: row.price_yearly,
    currency: row.currency,
    isActive: row.is_active,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }))
}

export async function getPlanFeatures(
  supabase: SupabaseClient,
  planId: string
): Promise<PlanFeature[]> {
  const { data, error } = await supabase
    .from("plan_features")
    .select("*")
    .eq("plan_id", planId)

  if (error) {
    console.error("[plans] getPlanFeatures error:", error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    planId: row.plan_id,
    featureKey: row.feature_key,
    enabled: row.enabled,
    limitValue: row.limit_value,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }))
}

export async function getResolvedPlan(
  supabase: SupabaseClient,
  tier: PlanTier
): Promise<ResolvedPlan | null> {
  const { data: plan, error } = await supabase
    .from("plan_definitions")
    .select("*")
    .eq("tier", tier)
    .eq("is_active", true)
    .single()

  if (error || !plan) {
    console.error("[plans] getResolvedPlan error:", error)
    return null
  }

  const features = await getPlanFeatures(supabase, plan.id)

  const featureMap: Record<string, PlanFeature> = {}
  for (const feature of features) {
    featureMap[feature.featureKey] = feature
  }

  return {
    tier: plan.tier as PlanTier,
    name: plan.name,
    priceMonthly: plan.price_monthly,
    priceYearly: plan.price_yearly,
    currency: plan.currency,
    features: featureMap,
  }
}

export async function getResolvedPlans(
  supabase: SupabaseClient
): Promise<ResolvedPlan[]> {
  const definitions = await getPlanDefinitions(supabase)
  const resolved = await Promise.all(
    definitions.map((def) => getResolvedPlan(supabase, def.tier))
  )
  return resolved.filter((r): r is ResolvedPlan => r !== null)
}

export function getFeatureLimit(
  plan: ResolvedPlan,
  featureKey: FeatureKey
): number | null {
  const feature = plan.features[featureKey]
  if (!feature || !feature.enabled) return null
  return feature.limitValue ?? null
}

export function isFeatureEnabled(
  plan: ResolvedPlan,
  featureKey: FeatureKey
): boolean {
  const feature = plan.features[featureKey]
  return feature?.enabled ?? false
}

export function isUnlimited(value: number | null): boolean {
  return value === -1
}

export function formatLimit(value: number | null): string {
  if (value === null || value === undefined) return "N/A"
  if (value === -1) return "Unlimited"
  return value.toLocaleString()
}

export function isWithinLimit(current: number, limit: number | null): boolean {
  if (limit === null) return false
  if (limit === -1) return true
  return current < limit
}

export async function seedPlanDefinitions(
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase.rpc("reset_monthly_credits")
  if (error) {
    console.error("[plans] seedPlanDefinitions error:", error)
  }
}
