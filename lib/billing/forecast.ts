/**
 * Usage forecasting and plan recommendation engine.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { createCreditService, type CreditOwner } from "@/lib/billing/credits"

export interface UsageForecast {
  dailyAverageCredits: number
  daysRemaining: number | null
  estimatedMonthlyCredits: number
  currentBalance: number
  monthlyCredits: number
  monthlyCap: number
  dailyAllowance: number
}

export interface PlanRecommendation {
  recommendedTier: "FREE" | "PRO" | "TEAM" | "ENTERPRISE"
  score: number
  reasons: string[]
  potentialSavings: number
}

export async function getUsageForecast(
  supabase: SupabaseClient,
  owner: CreditOwner
): Promise<UsageForecast> {
  const creditService = createCreditService(supabase)
  const balance = await creditService.getBalance(owner)

  const { data: events } = await supabase
    .from("usage_events")
    .select("credits_charged, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  const userId = "userId" in owner ? owner.userId : null
  const orgId = "organizationId" in owner ? owner.organizationId : null

  let filtered = events ?? []
  if (userId) filtered = filtered.filter((e) => e.created_at && true)
  if (orgId) filtered = filtered.filter((e) => e.created_at && true)

  const recent = filtered.filter((e) => {
    const date = new Date(e.created_at)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return date >= cutoff
  })

  const totalCredits = recent.reduce((sum, e) => sum + (e.credits_charged || 0), 0)
  const dailyAverage = recent.length > 0 ? totalCredits / 30 : 0
  const daysRemaining = dailyAverage > 0 ? Math.floor(balance.available / dailyAverage) : null
  const estimatedMonthly = Math.round(dailyAverage * 30)

  return {
    dailyAverageCredits: Math.round(dailyAverage * 10) / 10,
    daysRemaining,
    estimatedMonthlyCredits: estimatedMonthly,
    currentBalance: balance.available,
    monthlyCredits: balance.monthlyCredits,
    monthlyCap: balance.monthlyCap,
    dailyAllowance: balance.dailyAllowance,
  }
}

export async function getPlanRecommendation(
  supabase: SupabaseClient,
  owner: CreditOwner
): Promise<PlanRecommendation | null> {
  const userId = "userId" in owner ? owner.userId : null
  const orgId = "organizationId" in owner ? owner.organizationId : null

  if (!userId && !orgId) return null

  const { data: summary } = await supabase
    .from("feature_usage_summary")
    .select("feature_key, count, credits_used")
    .eq("user_id", userId ?? "")
    .eq("period", "monthly")

  const forecast = await getUsageForecast(supabase, owner)
  const reasons: string[] = []
  let score = 0

  const usage = {
    architect: summary?.find((s) => s.feature_key === "ai_architect")?.count ?? 0,
    workflow: summary?.find((s) => s.feature_key === "ai_workflow")?.count ?? 0,
    chat: summary?.find((s) => s.feature_key === "ai_chat")?.count ?? 0,
    search: summary?.find((s) => s.feature_key === "ai_search")?.count ?? 0,
  }

  if (forecast.estimatedMonthlyCredits > 5000) {
    reasons.push("High monthly AI credit usage")
    score += 40
  } else if (forecast.estimatedMonthlyCredits > 1000) {
    reasons.push("Growing AI credit usage")
    score += 20
  }

  if (usage.architect > 10) {
    reasons.push("Frequent Architect usage")
    score += 20
  }

  if (usage.workflow > 10) {
    reasons.push("Frequent workflow generation")
    score += 15
  }

  if (orgId) {
    reasons.push("Team collaboration requires shared credits")
    score += 25
  }

  let recommendedTier: PlanRecommendation["recommendedTier"] = "FREE"
  if (score >= 60) recommendedTier = "ENTERPRISE"
  else if (score >= 40) recommendedTier = "TEAM"
  else if (score >= 20) recommendedTier = "PRO"

  const potentialSavings = 0

  return {
    recommendedTier,
    score,
    reasons,
    potentialSavings,
  }
}

export function formatDaysRemaining(days: number | null): string {
  if (days === null) return "N/A"
  if (days < 0) return "Depleted"
  if (days === 0) return "Today"
  if (days === 1) return "1 day"
  if (days < 30) return `${days} days`
  return `${Math.floor(days / 30)} mo`
}

export function usagePercentage(used: number, limit: number): number {
  if (limit === -1 || limit === 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}
