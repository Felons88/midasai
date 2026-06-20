"use client"

import { useState } from "react"
import { Check, ArrowUpRight, Zap, HardDrive, Key, Globe, BarChart3, Shield } from "lucide-react"
import { PLAN_LIMITS, PlanTier, formatLimit } from "@/lib/subscriptions"

const PLANS: PlanTier[] = ["FREE", "STARTER", "PRO", "BUSINESS"]

const PLAN_DESCRIPTIONS: Record<PlanTier, string> = {
  FREE: "Perfect for getting started and exploring the platform.",
  STARTER: "For indie creators building their first audience.",
  PRO: "For serious creators and growing businesses.",
  BUSINESS: "For teams, agencies, and high-volume operations.",
}

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  FREE: [
    "100 API requests/hour",
    "1 GB storage",
    "3 active listings",
    "1 MCP server",
    "1 webhook",
    "Basic analytics",
    "Community support",
    "15% platform fee",
  ],
  STARTER: [
    "500 API requests/hour",
    "10 GB storage",
    "25 active listings",
    "5 MCP servers",
    "10 webhooks",
    "5 OAuth applications",
    "Advanced analytics",
    "AI upload assistant",
    "1 featured listing",
    "Email support",
    "12% platform fee",
  ],
  PRO: [
    "2,000 API requests/hour",
    "100 GB storage",
    "Unlimited listings",
    "25 MCP servers",
    "50 webhooks",
    "25 OAuth applications",
    "Professional analytics",
    "AI upload assistant",
    "5 featured listings",
    "Custom domain",
    "Creator verification badge",
    "Priority support",
    "8% platform fee",
  ],
  BUSINESS: [
    "10,000 API requests/hour",
    "500 GB storage",
    "Unlimited everything",
    "Enterprise analytics",
    "AI upload assistant",
    "Unlimited featured listings",
    "Custom domain",
    "Priority creator verification",
    "Dedicated support",
    "Enterprise audit logs",
    "5% platform fee",
  ],
}

const TIER_ACCENT: Record<PlanTier, string> = {
  FREE: "border-white/[0.08]",
  STARTER: "border-blue-500/30",
  PRO: "border-amber-500/40",
  BUSINESS: "border-purple-500/30",
}

const TIER_BUTTON: Record<PlanTier, string> = {
  FREE: "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.1]",
  STARTER: "bg-blue-500 text-white hover:bg-blue-400",
  PRO: "bg-amber-500 text-black hover:bg-amber-400",
  BUSINESS: "bg-purple-500 text-white hover:bg-purple-400",
}

const TIER_BADGE: Record<PlanTier, string> = {
  FREE: "bg-white/[0.06] text-white/50",
  STARTER: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  PRO: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  BUSINESS: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
}

export default function PricingClient() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (tier: PlanTier) => {
    if (tier === "FREE") {
      window.location.href = "/auth/register"
      return
    }
    setLoading(tier)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      } else {
        alert(json.error || "Unable to start checkout. Please try again.")
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#080810]">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6">
            <Zap className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Choose your plan</h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            Start free. Upgrade when you need more power. No hidden fees — ever.
          </p>

          {/* Interval toggle */}
          <div className="inline-flex items-center gap-1 mt-8 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${interval === "monthly" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${interval === "yearly" ? "bg-white text-black" : "text-white/50 hover:text-white"}`}
            >
              Yearly
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PLANS.map((tier) => {
            const plan = PLAN_LIMITS[tier]
            const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly
            const monthlyEquiv = interval === "yearly" && price > 0 ? Math.round(price / 12) : price
            const isPopular = tier === "PRO"
            const isLoading = loading === tier

            return (
              <div
                key={tier}
                className={`relative flex flex-col rounded-2xl border p-6 ${TIER_ACCENT[tier]} ${isPopular ? "bg-amber-500/[0.04]" : "bg-white/[0.01]"}`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-black whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Tier badge */}
                <div className={`self-start px-2.5 py-1 rounded-full text-xs font-bold mb-4 ${TIER_BADGE[tier]}`}>
                  {tier}
                </div>

                {/* Price */}
                <div className="mb-2">
                  {price === 0 ? (
                    <span className="text-4xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">${monthlyEquiv}</span>
                      <span className="text-white/40 text-sm">/mo</span>
                    </>
                  )}
                </div>
                {interval === "yearly" && price > 0 && (
                  <p className="text-xs text-emerald-400 mb-1">Billed ${price}/year</p>
                )}
                <p className="text-sm text-white/50 mb-6">{PLAN_DESCRIPTIONS[tier]}</p>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 mb-6 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-white/30" />
                    <span className="text-xs text-white/60">{plan.apiRateLimit.toLocaleString()}/hr</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="h-3 w-3 text-white/30" />
                    <span className="text-xs text-white/60">{plan.storageGb} GB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Key className="h-3 w-3 text-white/30" />
                    <span className="text-xs text-white/60">{formatLimit(plan.maxListings)} listings</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-white/30" />
                    <span className="text-xs text-white/60">{plan.platformFeePct}% fee</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {PLAN_FEATURES[tier].map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-white/60">{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(tier)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${TIER_BUTTON[tier]}`}
                >
                  {isLoading ? "Redirecting..." : tier === "FREE" ? "Get Started Free" : `Upgrade to ${tier}`}
                  {!isLoading && <ArrowUpRight className="h-4 w-4" />}
                </button>
              </div>
            )
          })}
        </div>

        {/* FAQ / feature comparison note */}
        <div className="mt-16 text-center">
          <p className="text-sm text-white/40">
            All plans include SSL, 99.9% uptime SLA, and weekly creator payouts.{" "}
            <a href="/docs/pricing" className="text-amber-400 hover:text-amber-300 transition-colors">
              Compare all features →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
