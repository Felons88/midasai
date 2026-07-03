/**
 * Centralized AI tool pricing service.
 * All AI feature credit costs are loaded from the database and can be tuned without code changes.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export interface AIToolPricing {
  id: string
  featureKey: string
  name: string
  description: string | null
  reserveCredits: number
  unitLabel: string
  isActive: boolean
  metadata: Record<string, unknown>
}

export type AIPricingFeatureKey =
  | "ai_chat"
  | "ai_search"
  | "prompt_analysis"
  | "prompt_categorization"
  | "marketplace_ai_summary"
  | "architect_generation"
  | "workflow_expansion"
  | "project_intelligence_scan"
  | "github_repository_analysis"
  | "ai_project_builder"
  | "ai_code_review"
  | "ai_optimization"
  | "ai_debugging"
  | "deployment_assistant"
  | "generate_description"
  | "generate_tags"

const DEFAULT_PRICING: Record<string, number> = {
  ai_chat: 5,
  ai_search: 3,
  prompt_analysis: 8,
  prompt_categorization: 10,
  marketplace_ai_summary: 5,
  architect_generation: 50,
  workflow_expansion: 75,
  project_intelligence_scan: 100,
  github_repository_analysis: 30,
  ai_project_builder: 150,
  ai_code_review: 40,
  ai_optimization: 25,
  ai_debugging: 35,
  deployment_assistant: 20,
  generate_description: 5,
  generate_tags: 5,
}

export async function getActivePricing(
  supabase: SupabaseClient
): Promise<AIToolPricing[]> {
  const { data, error } = await supabase
    .from("ai_tool_pricing")
    .select("*")
    .eq("is_active", true)
    .order("feature_key", { ascending: true })

  if (error) {
    console.error("[pricing] getActivePricing error:", error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    featureKey: row.feature_key,
    name: row.name,
    description: row.description,
    reserveCredits: row.reserve_credits,
    unitLabel: row.unit_label,
    isActive: row.is_active,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }))
}

export async function getPricingByFeatureKey(
  supabase: SupabaseClient,
  featureKey: string
): Promise<AIToolPricing | null> {
  const { data, error } = await supabase
    .from("ai_tool_pricing")
    .select("*")
    .eq("feature_key", featureKey)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("[pricing] getPricingByFeatureKey error:", featureKey, error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    featureKey: data.feature_key,
    name: data.name,
    description: data.description,
    reserveCredits: data.reserve_credits,
    unitLabel: data.unit_label,
    isActive: data.is_active,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
  }
}

export async function getReserveCredits(
  supabase: SupabaseClient,
  featureKey: string,
  units = 1
): Promise<number> {
  const pricing = await getPricingByFeatureKey(supabase, featureKey)
  const base = pricing?.reserveCredits ?? DEFAULT_PRICING[featureKey] ?? 0
  return base * Math.max(1, units)
}

export function formatCreditCost(cost: number, unitLabel = "call"): string {
  if (cost === 0) return "Free"
  return `${cost.toLocaleString()} credit${cost === 1 ? "" : "s"} per ${unitLabel}`
}
