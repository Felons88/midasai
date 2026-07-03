/**
 * Reward program service. All credits flow through the centralized Credit Engine.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { createCreditService, type CreditOwner } from "@/lib/billing/credits"

export async function applyReward(
  supabase: SupabaseClient,
  owner: CreditOwner,
  programKey: string,
  amount: number,
  reason: string,
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean; message: string }> {
  const { data: program } = await supabase
    .from("reward_programs")
    .select("id, is_active")
    .eq("key", programKey)
    .single()

  if (!program || !program.is_active) {
    return { success: false, message: "Reward program not active" }
  }

  const creditService = createCreditService(supabase)
  await creditService.addBonusCredits(owner, amount, `${programKey}: ${reason}`)

  const userId = "userId" in owner ? owner.userId : null
  const orgId = "organizationId" in owner ? owner.organizationId : null

  const { error } = await supabase.from("reward_history").insert({
    user_id: userId,
    organization_id: orgId,
    program_id: program.id,
    amount,
    reason,
    metadata,
  })

  if (error) {
    console.error("[rewards] reward_history insert error:", error)
    return { success: false, message: "Failed to record reward" }
  }

  return { success: true, message: `Rewarded ${amount} credits` }
}

export async function claimDailyLoginReward(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; amount: number; message: string }> {
  const { data: program } = await supabase
    .from("reward_programs")
    .select("id, rules")
    .eq("key", "daily_login")
    .single()

  if (!program) {
    return { success: false, amount: 0, message: "Daily login program not found" }
  }

  const { data: recent } = await supabase
    .from("reward_history")
    .select("created_at")
    .eq("user_id", userId)
    .eq("program_id", program.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recent?.created_at) {
    const lastClaim = new Date(recent.created_at)
    const now = new Date()
    if (lastClaim.toDateString() === now.toDateString()) {
      return { success: false, amount: 0, message: "Already claimed today" }
    }
  }

  const base = Number((program.rules as Record<string, number> | null)?.base ?? 10)

  const result = await applyReward(
    supabase,
    { userId },
    "daily_login",
    base,
    "Daily login bonus"
  )

  return { success: result.success, amount: base, message: result.message }
}

export async function processReferral(
  supabase: SupabaseClient,
  referrerId: string,
  refereeId: string
): Promise<{ success: boolean; message: string }> {
  const { data: program } = await supabase
    .from("reward_programs")
    .select("rules")
    .eq("key", "referral")
    .single()

  const rules = (program?.rules as Record<string, number> | null) ?? {}
  const referrerAmount = Number(rules.referrer ?? 100)
  const refereeAmount = Number(rules.referee ?? 50)

  const { error: referralError } = await supabase.from("referral_rewards").insert({
    referrer_id: referrerId,
    referee_id: refereeId,
    status: "completed",
    amount: referrerAmount,
    source: "signup",
  })

  if (referralError) {
    console.error("[rewards] referral_rewards insert error:", referralError)
  }

  await applyReward(supabase, { userId: referrerId }, "referral", referrerAmount, `Referral: ${refereeId}`)
  await applyReward(supabase, { userId: refereeId }, "referral", refereeAmount, "Referral sign-up bonus")

  return { success: true, message: "Referral rewards applied" }
}
