/**
 * Upgrade event tracking and trigger detection.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export type UpgradeEventType =
  | "trigger_threshold"
  | "prompt_shown"
  | "prompt_dismissed"
  | "prompt_accepted"
  | "feature_locked"
  | "plan_changed"
  | "payment_failed"
  | "payment_recovered"

export interface UpgradeEventInput {
  userId: string
  organizationId?: string
  eventType: UpgradeEventType
  trigger?: string
  currentTier?: string
  recommendedTier?: string
  converted?: boolean
  metadata?: Record<string, unknown>
}

export async function recordUpgradeEvent(
  supabase: SupabaseClient,
  input: UpgradeEventInput
): Promise<void> {
  const { error } = await supabase.from("upgrade_events").insert({
    user_id: input.userId,
    organization_id: input.organizationId ?? null,
    event_type: input.eventType,
    trigger: input.trigger ?? null,
    current_tier: input.currentTier ?? null,
    recommended_tier: input.recommendedTier ?? null,
    converted: input.converted ?? false,
    metadata: input.metadata ?? {},
  })

  if (error) {
    console.error("[upgrade-events] recordUpgradeEvent error:", error)
  }
}

export interface UsageThreshold {
  feature: string
  used: number
  limit: number
  percentage: number
}

export function detectUsageThreshold(used: number, limit: number): UsageThreshold | null {
  const percentage = limit === -1 || limit === 0 ? 0 : Math.round((used / limit) * 100)
  if (percentage >= 100) return { feature: "", used, limit, percentage }
  if (percentage >= 95) return { feature: "", used, limit, percentage }
  if (percentage >= 90) return { feature: "", used, limit, percentage }
  if (percentage >= 75) return { feature: "", used, limit, percentage }
  return null
}

export function getThresholdSeverity(percentage: number): "info" | "warning" | "critical" | "locked" {
  if (percentage >= 100) return "locked"
  if (percentage >= 90) return "critical"
  if (percentage >= 75) return "warning"
  return "info"
}
