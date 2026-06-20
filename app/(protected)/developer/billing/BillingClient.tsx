"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  CreditCard, Zap, HardDrive, Key, Globe, BarChart3,
  CheckCircle, ArrowUpRight, AlertTriangle, ExternalLink,
  Shield, Star
} from "lucide-react"
import { PLAN_LIMITS, getPlanLimits, formatLimit, PlanTier, PLAN_ORDER } from "@/lib/subscriptions"

interface BillingData {
  subscription: {
    tier: string | null
    status: string | null
    current_period_end: string | null
    current_period_start: string | null
    cancel_at_period_end: boolean | null
    stripe_subscription_id: string | null
  } | null
  billingEvents: Array<{
    event_type: string
    amount: number | null
    currency: string | null
    created_at: string | null
    metadata: Record<string, unknown> | null
  }>
  usage: {
    apiRequestsMonth: number
    storageGbUsed: number
    activeApiKeys: number
    webhooks: number
    mcpServers: number
  }
}

const TIER_COLORS: Record<string, string> = {
  FREE: "text-white/60",
  STARTER: "text-blue-400",
  PRO: "text-amber-400",
  BUSINESS: "text-purple-400",
}

const TIER_BADGES: Record<string, string> = {
  FREE: "bg-white/[0.06] text-white/60",
  STARTER: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  PRO: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  BUSINESS: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
}

function eventLabel(type: string): string {
  const map: Record<string, string> = {
    "subscription.created": "Subscription started",
    "subscription.updated": "Subscription updated",
    "subscription.cancelled": "Subscription cancelled",
    "invoice.paid": "Payment received",
    "invoice.payment_failed": "Payment failed",
    "charge.refunded": "Refund issued",
  }
  return map[type] || type
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (!amount) return ""
  return `$${(amount / 100).toFixed(2)} ${(currency || "usd").toUpperCase()}`
}

function UsageBar({ label, used, total, unit = "" }: { label: string; used: number; total: number; unit?: string }) {
  const unlimited = total === -1
  const pct = unlimited ? 0 : Math.min((used / total) * 100, 100)
  const warn = pct > 80

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-sm text-white">
          {used.toLocaleString()}{unit} {unlimited ? "" : `/ ${formatLimit(total)}${unit}`}
          {unlimited && <span className="text-xs text-white/40 ml-1">unlimited</span>}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${warn ? "bg-red-500" : "bg-amber-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function BillingClient({ data }: { data: BillingData }) {
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const router = useRouter()

  const tier = (data.subscription?.tier || "FREE") as PlanTier
  const limits = getPlanLimits(tier)
  const { usage, billingEvents } = data

  const isActive = data.subscription?.status === "ACTIVE"
  const periodEnd = data.subscription?.current_period_end
    ? new Date(data.subscription.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null
  const willCancel = data.subscription?.cancel_at_period_end

  const handlePortal = async () => {
    setLoadingPortal(true)
    try {
      const res = await fetch("/api/stripe/customer-portal", { method: "POST" })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else alert(json.error || "Could not open billing portal")
    } finally {
      setLoadingPortal(false)
    }
  }

  const handleUpgrade = async (targetTier: PlanTier) => {
    setLoadingCheckout(targetTier)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier, interval: billingInterval }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else alert(json.error || "Could not start checkout")
    } finally {
      setLoadingCheckout(null)
    }
  }

  const upgradePlans = (PLAN_ORDER as PlanTier[]).filter(t => {
    const idx = PLAN_ORDER.indexOf(t)
    const currentIdx = PLAN_ORDER.indexOf(tier)
    return idx > currentIdx
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Billing & Plan</h1>
          <p className="text-sm text-white/50">Manage your subscription, usage limits, and payment method.</p>
        </div>
        {data.subscription?.stripe_subscription_id && (
          <button
            onClick={handlePortal}
            disabled={loadingPortal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {loadingPortal ? "Opening..." : "Manage Billing"}
          </button>
        )}
      </div>

      {/* Current Plan Card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-white">Current Plan</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TIER_BADGES[tier]}`}>
                {tier}
              </span>
              {isActive && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              )}
            </div>
            <p className={`text-3xl font-bold ${TIER_COLORS[tier]}`}>
              ${limits.priceMonthly}<span className="text-sm font-normal text-white/40">/month</span>
            </p>
            {periodEnd && (
              <p className="text-xs text-white/40 mt-1">
                {willCancel ? `Cancels on ${periodEnd}` : `Renews on ${periodEnd}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {tier !== "FREE" && (
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
              >
                {loadingPortal ? "..." : "Cancel / Change"}
              </button>
            )}
          </div>
        </div>

        {/* Usage bars */}
        <div className="space-y-4 pt-4 border-t border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">This Month&apos;s Usage</h3>
          <UsageBar
            label="API Requests"
            used={usage.apiRequestsMonth}
            total={limits.apiRateLimit * 24 * 30}
          />
          <UsageBar
            label="Storage"
            used={Math.round(usage.storageGbUsed * 100) / 100}
            total={limits.storageGb}
            unit=" GB"
          />
          <UsageBar
            label="Active API Keys"
            used={usage.activeApiKeys}
            total={3}
          />
          <UsageBar
            label="Webhooks"
            used={usage.webhooks}
            total={limits.maxWebhooks}
          />
          <UsageBar
            label="MCP Servers"
            used={usage.mcpServers}
            total={limits.maxMcpServers}
          />
        </div>

        {/* Plan features summary */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          {[
            { icon: Zap, label: "Rate Limit", value: `${limits.apiRateLimit.toLocaleString()}/hr` },
            { icon: HardDrive, label: "Storage", value: `${limits.storageGb} GB` },
            { icon: Shield, label: "Platform Fee", value: `${limits.platformFeePct}%` },
            { icon: BarChart3, label: "Analytics", value: limits.analyticsTier },
            { icon: Globe, label: "Custom Domain", value: limits.canUseCustomDomain ? "Yes" : "No" },
            { icon: Star, label: "Featured Listings", value: formatLimit(limits.maxFeaturedListings) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <Icon className="h-4 w-4 text-white/30 flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40">{label}</p>
                <p className="text-sm font-medium text-white capitalize">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Options */}
      {upgradePlans.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white">Upgrade Your Plan</h2>
              <p className="text-sm text-white/40 mt-0.5">Unlock more features and higher limits.</p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${billingInterval === "monthly" ? "bg-amber-500 text-black" : "text-white/50 hover:text-white"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${billingInterval === "yearly" ? "bg-amber-500 text-black" : "text-white/50 hover:text-white"}`}
              >
                Yearly <span className="text-emerald-400 ml-1">-17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upgradePlans.map(planTier => {
              const plan = PLAN_LIMITS[planTier]
              const price = billingInterval === "yearly" ? plan.priceYearly : plan.priceMonthly
              const monthlyEquiv = billingInterval === "yearly" ? Math.round(price / 12) : price
              const isLoading = loadingCheckout === planTier
              return (
                <div key={planTier} className={`relative p-5 rounded-xl border ${planTier === "PRO" ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-white/[0.08] bg-white/[0.01]"}`}>
                  {planTier === "PRO" && (
                    <div className="absolute -top-3 left-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-black">Most Popular</span>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-bold ${TIER_COLORS[planTier]}`}>{planTier}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${monthlyEquiv}<span className="text-sm font-normal text-white/40">/mo</span>
                    </p>
                    {billingInterval === "yearly" && (
                      <p className="text-xs text-emerald-400 mt-0.5">Billed ${price}/year</p>
                    )}
                  </div>
                  <ul className="space-y-2 mb-5">
                    {[
                      `${plan.apiRateLimit.toLocaleString()} req/hr`,
                      `${plan.storageGb} GB storage`,
                      `${formatLimit(plan.maxListings)} listings`,
                      `${plan.platformFeePct}% platform fee`,
                      plan.canUseAiUpload ? "AI upload assistant" : null,
                      plan.canUseCustomDomain ? "Custom domain" : null,
                    ].filter(Boolean).map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(planTier)}
                    disabled={isLoading || !plan.stripePriceIdMonthly}
                    className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                      planTier === "PRO"
                        ? "bg-amber-500 text-black hover:bg-amber-400"
                        : "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {isLoading ? "Redirecting..." : !plan.stripePriceIdMonthly ? "Coming Soon" : `Upgrade to ${planTier}`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Billing History */}
      {billingEvents.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="p-5 border-b border-white/[0.06]">
            <h2 className="text-base font-semibold text-white">Billing History</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {billingEvents.map((evt, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-white">{eventLabel(evt.event_type)}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {evt.created_at ? new Date(evt.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </p>
                </div>
                <div className="text-right">
                  {evt.amount ? (
                    <p className={`text-sm font-medium ${evt.event_type.includes("failed") ? "text-red-400" : evt.event_type.includes("refund") ? "text-amber-400" : "text-emerald-400"}`}>
                      {evt.event_type.includes("refund") ? "-" : "+"}{formatAmount(evt.amount, evt.currency)}
                    </p>
                  ) : null}
                  <span className={`text-xs ${
                    evt.event_type.includes("failed") ? "text-red-400" :
                    evt.event_type.includes("cancel") ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {evt.event_type.includes("failed") ? "Failed" :
                     evt.event_type.includes("cancel") ? "Cancelled" : "Completed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {billingEvents.length === 0 && tier === "FREE" && (
        <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">You&apos;re on the Free plan</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Upgrade to unlock higher rate limits, more storage, advanced analytics, and lower platform fees.
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            View Plans
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
