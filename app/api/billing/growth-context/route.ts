import { createClient } from "@/lib/supabase/server"
import { createCreditService } from "@/lib/billing/credits"
import { getUsageForecast, getPlanRecommendation } from "@/lib/billing/forecast"
import { isPromptDismissed } from "@/lib/billing/dismissals"
import { recordUpgradeEvent } from "@/lib/billing/upgrade-events"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const owner = { userId: user.id }
  const creditService = createCreditService(supabase)

  const [balance, forecast, recommendation, sub] = await Promise.all([
    creditService.getBalance(owner),
    getUsageForecast(supabase, owner),
    getPlanRecommendation(supabase, owner),
    supabase.from("subscriptions").select("tier, current_period_end").eq("user_id", user.id).in("status", ["ACTIVE", "TRIALING"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ])

  const tier = (sub?.data?.tier ?? "FREE") as string
  const daysToRenewal = sub?.data?.current_period_end
    ? Math.ceil((new Date(sub.data.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const creditLow = balance.monthlyCredits > 0 && balance.available < balance.monthlyCredits * 0.2
  const creditDepleted = balance.available <= 0 && balance.monthlyCredits > 0

  const prompts: { key: string; type: string; severity: string; title: string; description: string; recommendedTier?: string; cta?: string; href?: string }[] = []

  if (creditDepleted) {
    const key = "credit_depleted"
    const dismissed = await isPromptDismissed(supabase, user.id, key)
    if (!dismissed) {
      prompts.push({
        key,
        type: "credit",
        severity: "critical",
        title: "Credits depleted",
        description: "Purchase a credit pack or upgrade your plan to continue using AI features.",
        cta: "Buy credits",
        href: "/account/wallet",
      })
    }
  } else if (creditLow) {
    const key = "credit_low"
    const dismissed = await isPromptDismissed(supabase, user.id, key)
    if (!dismissed) {
      prompts.push({
        key,
        type: "credit",
        severity: "warning",
        title: "Low credits",
        description: `You have ${balance.available} credits left.`,
        cta: "Buy credits",
        href: "/account/wallet",
      })
    }
  }

  if (recommendation && recommendation.score >= 20 && tier !== recommendation.recommendedTier) {
    const key = `recommend_${recommendation.recommendedTier.toLowerCase()}`
    const dismissed = await isPromptDismissed(supabase, user.id, key)
    if (!dismissed) {
      prompts.push({
        key,
        type: "upgrade",
        severity: "info",
        title: `Recommended: ${recommendation.recommendedTier}`,
        description: recommendation.reasons.join(" · "),
        recommendedTier: recommendation.recommendedTier,
        cta: "View plans",
        href: "/account/billing",
      })
    }
  }

  if (daysToRenewal !== null && daysToRenewal <= 7 && daysToRenewal > 0) {
    const key = "subscription_renewing"
    const dismissed = await isPromptDismissed(supabase, user.id, key)
    if (!dismissed) {
      prompts.push({
        key,
        type: "billing",
        severity: "info",
        title: "Subscription renews soon",
        description: `Your plan renews in ${daysToRenewal} days.`,
        cta: "Billing",
        href: "/account/billing",
      })
    }
  }

  await recordUpgradeEvent(supabase, {
    userId: user.id,
    eventType: "trigger_threshold",
    currentTier: tier,
    recommendedTier: recommendation?.recommendedTier,
    metadata: {
      prompt_count: prompts.length,
      credit_low: creditLow,
      credit_depleted: creditDepleted,
      days_to_renewal: daysToRenewal,
      recommendation_score: recommendation?.score,
    },
  })

  return NextResponse.json({
    balance,
    forecast,
    recommendation,
    tier,
    daysToRenewal,
    prompts,
  })
}
