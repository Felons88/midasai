/**
 * Server-side helper for AI endpoints that use the centralized credit reservation engine.
 * Wraps UsageService.trackAI with standard API response formatting.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { UsageService, type UsageFeatureKey } from "@/lib/billing/usage"
import { createCreditService } from "@/lib/billing/credits"

export interface AIReservationContext {
  supabase: SupabaseClient
  userId: string
  organizationId?: string | null
}

export interface AIReservationResult<T> {
  result: T | null
  error: string | null
  creditsReserved: number
  creditsCharged: number
  creditsRefunded: number
  reservationId: string | null
  availableBalance: number
}

export async function runWithAIReservation<T>(
  ctx: AIReservationContext,
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
): Promise<AIReservationResult<T>> {
  const usage = new UsageService(ctx.supabase)
  const creditService = createCreditService(ctx.supabase)

  const owner = ctx.organizationId
    ? { organizationId: ctx.organizationId }
    : { userId: ctx.userId }

  const balanceBefore = await creditService.getBalance(owner)

  const trackResult = await usage.trackAI(owner, input, operation, options)

  return {
    result: trackResult.result,
    error: trackResult.error,
    creditsReserved: balanceBefore.available,
    creditsCharged: trackResult.creditsCharged,
    creditsRefunded: trackResult.creditsRefunded,
    reservationId: trackResult.reservationId,
    availableBalance: balanceBefore.available - trackResult.creditsCharged,
  }
}

export async function checkAICredits(
  ctx: AIReservationContext,
  featureKey: UsageFeatureKey,
  units = 1
): Promise<{ allowed: boolean; cost: number; available: number; message?: string }> {
  const creditService = createCreditService(ctx.supabase)
  const usage = new UsageService(ctx.supabase)

  const owner = ctx.organizationId
    ? { organizationId: ctx.organizationId }
    : { userId: ctx.userId }

  const [balance, cost] = await Promise.all([
    creditService.getBalance(owner),
    usage.getEstimatedCredits(featureKey, units),
  ])

  if (balance.available < cost) {
    return {
      allowed: false,
      cost,
      available: balance.available,
      message: `This action costs ${cost} credits. You have ${balance.available} available.`,
    }
  }

  return { allowed: true, cost, available: balance.available }
}
