/**
 * Centralized AI usage tracking.
 * Records every AI operation, metered feature, and transaction event.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { createCreditService, type CreditOwner } from "@/lib/billing/credits"
import { getReserveCredits } from "@/lib/billing/pricing"

export type UsageFeatureKey =
  | "ai_chat"
  | "ai_architect"
  | "ai_workflow"
  | "ai_search"
  | "ai_upload"
  | "search"
  | "import"
  | "download"
  | "prompt_analysis"
  | "prompt_categorization"
  | "marketplace_ai_summary"
  | "project_intelligence_scan"
  | "github_repository_analysis"
  | "ai_project_builder"
  | "ai_code_review"
  | "ai_optimization"
  | "ai_debugging"
  | "deployment_assistant"
  | "generate_description"
  | "generate_tags"

export interface UsageEventInput {
  userId?: string
  organizationId?: string
  featureKey: UsageFeatureKey
  operationId: string
  model?: string
  provider?: string
  creditsReserved?: number
  creditsCharged?: number
  creditsRefunded?: number
  durationMs?: number
  status?: "success" | "partial" | "failure"
  metadata?: Record<string, unknown>
}

export interface TrackedAIOperation<T> {
  result: T
  reservationId: string
  creditsCharged: number
  creditsRefunded: number
}

export class UsageService {
  constructor(private supabase: SupabaseClient) {}

  async recordEvent(input: UsageEventInput): Promise<void> {
    const { error } = await this.supabase.from("usage_events").insert({
      user_id: input.userId ?? null,
      organization_id: input.organizationId ?? null,
      feature_key: input.featureKey,
      operation_id: input.operationId,
      model: input.model ?? null,
      provider: input.provider ?? null,
      credits_reserved: input.creditsReserved ?? 0,
      credits_charged: input.creditsCharged ?? 0,
      credits_refunded: input.creditsRefunded ?? 0,
      duration_ms: input.durationMs ?? null,
      status: input.status ?? "success",
      metadata: input.metadata ?? {},
    })

    if (error) {
      console.error("[usage] recordEvent error:", error)
    }
  }

  async trackAI<T>(
    owner: CreditOwner,
    input: {
      featureKey: UsageFeatureKey
      operationId: string
      model?: string
      provider?: string
      estimatedCredits?: number
      units?: number
      metadata?: Record<string, unknown>
    },
    operation: () => Promise<T>,
    options: {
      completionPct?: (result: T) => number
      captureAmount?: (result: T) => number
      ttlMs?: number
    } = {}
  ): Promise<{ result: T | null; error: string | null; creditsCharged: number; creditsRefunded: number; reservationId: string | null }> {
    const creditService = createCreditService(this.supabase)
    const start = Date.now()
    const operationId = input.operationId

    const estimatedCredits =
      input.estimatedCredits ??
      (await getReserveCredits(this.supabase, input.featureKey, input.units ?? 1))

    const reservation = await creditService.reserveCredits(
      owner,
      operationId,
      input.featureKey,
      estimatedCredits,
      options.ttlMs
    )

    if (!reservation.allowed) {
      await this.recordEvent({
        ...this.ownerFields(owner),
        featureKey: input.featureKey,
        operationId,
        creditsReserved: estimatedCredits,
        creditsCharged: 0,
        creditsRefunded: 0,
        durationMs: 0,
        status: "failure",
        metadata: { reason: "insufficient_credits", ...input.metadata },
      })
      return {
        result: null,
        error: reservation.message ?? "Insufficient credits",
        creditsCharged: 0,
        creditsRefunded: 0,
        reservationId: null,
      }
    }

    let result: T | null = null
    let error: string | null = null
    try {
      result = await operation()
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }

    const durationMs = Date.now() - start

    if (error) {
      const releaseResult = await creditService.releaseCredits(
        owner,
        reservation.reservationId
      )
      await this.recordEvent({
        ...this.ownerFields(owner),
        featureKey: input.featureKey,
        operationId,
        model: input.model,
        provider: input.provider,
        creditsReserved: estimatedCredits,
        creditsCharged: 0,
        creditsRefunded: releaseResult.refunded,
        durationMs,
        status: "failure",
        metadata: { error, ...input.metadata },
      })
      return {
        result: null,
        error,
        creditsCharged: 0,
        creditsRefunded: releaseResult.refunded,
        reservationId: reservation.reservationId,
      }
    }

    let actualAmount = estimatedCredits
    if (options.captureAmount) {
      actualAmount = Math.max(0, Math.min(estimatedCredits, options.captureAmount(result as T)))
    } else if (options.completionPct) {
      const pct = Math.max(0, Math.min(1, options.completionPct(result as T)))
      actualAmount = Math.round(estimatedCredits * pct)
    }

    const captureResult = await creditService.captureCredits(
      owner,
      reservation.reservationId,
      actualAmount
    )

    const status: "success" | "partial" | "failure" =
      captureResult.refunded > 0 ? "partial" : "success"

    await this.recordEvent({
      ...this.ownerFields(owner),
      featureKey: input.featureKey,
      operationId,
      model: input.model,
      provider: input.provider,
      creditsReserved: estimatedCredits,
      creditsCharged: captureResult.captured,
      creditsRefunded: captureResult.refunded,
      durationMs,
      status,
      metadata: { ...input.metadata, completion_pct: actualAmount / estimatedCredits },
    })

    return {
      result,
      error: null,
      creditsCharged: captureResult.captured,
      creditsRefunded: captureResult.refunded,
      reservationId: reservation.reservationId,
    }
  }

  async getEstimatedCredits(featureKey: UsageFeatureKey, units = 1): Promise<number> {
    return getReserveCredits(this.supabase, featureKey, units)
  }

  async getUsageHistory(
    owner: CreditOwner,
    options: { from?: string; to?: string; limit?: number; offset?: number } = {}
  ) {
    const { from, to, limit = 100, offset = 0 } = options
    let query = this.supabase
      .from("usage_events")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if ("userId" in owner) {
      query = query.eq("user_id", owner.userId)
    } else {
      query = query.eq("organization_id", owner.organizationId)
    }

    if (from) query = query.gte("created_at", from)
    if (to) query = query.lte("created_at", to)

    const { data, error } = await query
    if (error) {
      console.error("[usage] getUsageHistory error:", error)
      return []
    }
    return data ?? []
  }

  private ownerFields(owner: CreditOwner): { userId?: string; organizationId?: string } {
    if ("userId" in owner) return { userId: owner.userId }
    return { organizationId: owner.organizationId }
  }
}

export function createUsageService(supabase: SupabaseClient): UsageService {
  return new UsageService(supabase)
}
