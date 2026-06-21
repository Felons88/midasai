"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CreditCard, Zap, HardDrive, Key, Globe, BarChart3,
  CheckCircle, ArrowUpRight, AlertTriangle, ExternalLink,
  Shield, Star, Sparkles, TrendingUp, Users, Download,
  RefreshCw, Crown, Rocket, Building2, ChevronRight,
  Receipt, Bell
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

// ── Tier config ────────────────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  FREE:     "text-white/60",
  STARTER:  "text-blue-400",
  PRO:      "text-amber-400",
  BUSINESS: "text-purple-400",
}
const TIER_BG: Record<string, string> = {
  FREE:     "from-white/[0.03] to-white/[0.01] border-white/[0.08]",
  STARTER:  "from-blue-500/10 to-blue-600/5 border-blue-500/20",
  PRO:      "from-amber-500/10 to-amber-600/5 border-amber-500/20",
  BUSINESS: "from-purple-500/10 to-purple-600/5 border-purple-500/20",
}
const TIER_ICONS: Record<string, React.ElementType> = {
  FREE: Star, STARTER: Rocket, PRO: Crown, BUSINESS: Building2,
}
const NEXT_TIER: Record<string, PlanTier | null> = {
  FREE: "STARTER", STARTER: "PRO", PRO: "BUSINESS", BUSINESS: null,
}
const NEXT_TIER_LABEL: Record<string, string> = {
  FREE:    "Upgrade to Starter — Unlock more power",
  STARTER: "Upgrade to Pro — Most popular plan",
  PRO:     "Upgrade to Business — Enterprise-grade",
}

function eventLabel(type: string): string {
  const map: Record<string, string> = {
    "subscription.created":   "Subscription started",
    "subscription.updated":   "Subscription updated",
    "subscription.cancelled": "Subscription cancelled",
    "invoice.paid":           "Payment received",
    "invoice.payment_failed": "Payment failed",
    "charge.refunded":        "Refund issued",
  }
  return map[type] || type
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (!amount) return ""
  return `$${(amount / 100).toFixed(2)} ${(currency || "usd").toUpperCase()}`
}

function UsageBar({ label, used, total, unit = "", warn: forceWarn }: {
  label: string; used: number; total: number; unit?: string; warn?: boolean
}) {
  const unlimited = total === -1
  const pct = unlimited ? 0 : Math.min((used / total) * 100, 100)
  const isWarn = forceWarn || pct > 80
  const isCritical = pct > 95

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">{label}</span>
          {isWarn && !unlimited && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${isCritical ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
              {isCritical ? "Limit reached" : "80% used"}
            </span>
          )}
        </div>
        <span className="text-sm text-white">
          {used.toLocaleString()}{unit}
          {!unlimited && <span className="text-white/40"> / {formatLimit(total)}{unit}</span>}
          {unlimited && <span className="text-xs text-emerald-400 ml-1">∞ Unlimited</span>}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isCritical ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

// Animated upgrade button — pulses, shimmers, breathes
function UpgradeButton({ tier, label, onClick, loading }: {
  tier: PlanTier; label: string; onClick: () => void; loading: boolean
}) {
  const [shimmer, setShimmer] = useState(false)
  useEffect(() => {
    const id = setInterval(() => {
      setShimmer(true)
      setTimeout(() => setShimmer(false), 800)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const colors: Record<PlanTier, string> = {
    FREE:     "from-white/10 to-white/5 border-white/20 text-white",
    STARTER:  "from-blue-500 to-blue-600 border-blue-400/50 text-white shadow-blue-500/30",
    PRO:      "from-amber-500 to-amber-600 border-amber-400/50 text-black shadow-amber-500/40",
    BUSINESS: "from-purple-500 to-purple-600 border-purple-400/50 text-white shadow-purple-500/30",
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        relative w-full h-14 rounded-2xl bg-gradient-to-r ${colors[tier]}
        border font-bold text-base shadow-lg hover:shadow-xl
        transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden
        animate-pulse-subtle
      `}
      style={{ animationDuration: "3s" }}
    >
      {/* Shimmer sweep */}
      {shimmer && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer pointer-events-none" />
      )}
      {/* Glow ring */}
      <span className="absolute inset-0 rounded-2xl ring-2 ring-white/10 pointer-events-none" />
      <span className="relative flex items-center justify-center gap-3">
        <Sparkles className="h-5 w-5" />
        {loading ? "Redirecting to checkout..." : label}
        {!loading && <ChevronRight className="h-4 w-4" />}
      </span>
    </button>
  )
}

export default function BillingClient({ data }: { data: BillingData }) {
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")

  const tier = (data.subscription?.tier || "FREE") as PlanTier
  const limits = getPlanLimits(tier)
  const { usage, billingEvents } = data
  const TierIcon = TIER_ICONS[tier] || Star

  const isActive = data.subscription?.status === "ACTIVE"
  const periodEnd = data.subscription?.current_period_end
    ? new Date(data.subscription.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null
  const willCancel = data.subscription?.cancel_at_period_end
  const nextTier = NEXT_TIER[tier]
  const hasStripe = !!data.subscription?.stripe_subscription_id

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

  const upgradePlans = (PLAN_ORDER as PlanTier[]).filter(t =>
    PLAN_ORDER.indexOf(t) > PLAN_ORDER.indexOf(tier)
  )

  // Usage warnings
  const apiLimit = limits.apiRateLimit * 24 * 30
  const apiPct = apiLimit > 0 ? (usage.apiRequestsMonth / apiLimit) * 100 : 0
  const storagePct = limits.storageGb > 0 ? (usage.storageGbUsed / limits.storageGb) * 100 : 0

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Billing & Plan</h1>
          <p className="text-sm text-white/50">Manage your subscription, usage, and payment method.</p>
        </div>
        {hasStripe && (
          <button onClick={handlePortal} disabled={loadingPortal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50">
            <ExternalLink className="h-3.5 w-3.5" />
            {loadingPortal ? "Opening..." : "Stripe Portal"}
          </button>
        )}
      </div>

      {/* ── CURRENT PLAN CARD ─────────────────────────────────── */}
      <div className={`rounded-2xl bg-gradient-to-br ${TIER_BG[tier]} border p-6`}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
              tier === "PRO" ? "bg-amber-500/20" : tier === "BUSINESS" ? "bg-purple-500/20" :
              tier === "STARTER" ? "bg-blue-500/20" : "bg-white/[0.06]"
            }`}>
              <TierIcon className={`h-7 w-7 ${TIER_COLORS[tier]}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{tier} Plan</h2>
                {isActive && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                )}
                {willCancel && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-semibold">
                    Cancels {periodEnd}
                  </span>
                )}
              </div>
              <p className={`text-3xl font-bold ${TIER_COLORS[tier]}`}>
                ${limits.priceMonthly}
                <span className="text-sm font-normal text-white/40">/month</span>
              </p>
              {periodEnd && !willCancel && (
                <p className="text-xs text-white/40 mt-0.5">Renews {periodEnd}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 items-end">
            {hasStripe && (
              <>
                <button onClick={handlePortal} disabled={loadingPortal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 transition-colors">
                  <CreditCard className="h-3.5 w-3.5" /> Update Payment
                </button>
                <button onClick={handlePortal} disabled={loadingPortal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 transition-colors">
                  <Download className="h-3.5 w-3.5" /> Download Invoices
                </button>
                {tier !== "FREE" && (
                  <button onClick={handlePortal} disabled={loadingPortal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/60 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" /> {willCancel ? "Reactivate" : "Cancel Plan"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Usage bars */}
        <div className="space-y-4 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Monthly Usage</h3>
            {(apiPct > 80 || storagePct > 80) && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Bell className="h-3 w-3" /> Usage warning
              </span>
            )}
          </div>
          <UsageBar label="API Requests" used={usage.apiRequestsMonth} total={apiLimit} warn={apiPct > 80} />
          <UsageBar label="Storage" used={Math.round(usage.storageGbUsed * 100) / 100} total={limits.storageGb} unit=" GB" warn={storagePct > 80} />
          <div className="grid grid-cols-2 gap-4">
            <UsageBar label="API Keys" used={usage.activeApiKeys} total={limits.maxWebhooks > 0 ? 3 : -1} />
            <UsageBar label="Webhooks" used={usage.webhooks} total={limits.maxWebhooks} />
          </div>
        </div>

        {/* Plan perks grid */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/[0.06]">
          {[
            { icon: Zap,       label: "Rate Limit",      value: `${limits.apiRateLimit.toLocaleString()}/hr` },
            { icon: HardDrive, label: "Storage",          value: `${limits.storageGb} GB` },
            { icon: Shield,    label: "Platform Fee",     value: `${limits.platformFeePct}%` },
            { icon: BarChart3, label: "Analytics",        value: limits.analyticsTier },
            { icon: Globe,     label: "Custom Domain",    value: limits.canUseCustomDomain ? "✓ Included" : "✗ Not included" },
            { icon: Star,      label: "Featured Slots",   value: formatLimit(limits.maxFeaturedListings) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <Icon className="h-4 w-4 text-white/30 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-white capitalize">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ANIMATED UPGRADE CTA ───────────────────────────────── */}
      {nextTier && (
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-transparent p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{NEXT_TIER_LABEL[tier]}</h2>
              <p className="text-sm text-white/40 mt-0.5">
                {billingInterval === "yearly"
                  ? `Save ${Math.round(100 - (PLAN_LIMITS[nextTier].priceYearly / (PLAN_LIMITS[nextTier].priceMonthly * 12)) * 100)}% vs monthly billing`
                  : "Switch to annual and save up to 17%"}
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <button onClick={() => setBillingInterval("monthly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${billingInterval === "monthly" ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white"}`}>
                Monthly
              </button>
              <button onClick={() => setBillingInterval("yearly")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${billingInterval === "yearly" ? "bg-amber-500 text-black" : "text-white/40 hover:text-white"}`}>
                Annual <span className={billingInterval === "yearly" ? "text-black/70" : "text-emerald-400"}>-17%</span>
              </button>
            </div>
          </div>

          {/* What you unlock */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Zap,       label: `${PLAN_LIMITS[nextTier].apiRateLimit.toLocaleString()} API req/hr`,     sub: `vs ${limits.apiRateLimit.toLocaleString()} now` },
              { icon: HardDrive, label: `${PLAN_LIMITS[nextTier].storageGb} GB storage`,                        sub: `vs ${limits.storageGb} GB now` },
              { icon: TrendingUp,label: `${PLAN_LIMITS[nextTier].platformFeePct}% platform fee`,               sub: `vs ${limits.platformFeePct}% now — save more` },
              { icon: CheckCircle,label: PLAN_LIMITS[nextTier].canUseCustomDomain ? "Custom domain" : PLAN_LIMITS[nextTier].canUseAiUpload ? "AI upload assistant" : "Priority support",
                                  sub: "Included in this plan" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/40">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Price display */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              ${billingInterval === "yearly"
                ? Math.round(PLAN_LIMITS[nextTier].priceYearly / 12)
                : PLAN_LIMITS[nextTier].priceMonthly}
            </span>
            <span className="text-white/40">/month</span>
            {billingInterval === "yearly" && (
              <span className="text-sm text-emerald-400 font-semibold">
                (${PLAN_LIMITS[nextTier].priceYearly}/year)
              </span>
            )}
          </div>

          <UpgradeButton
            tier={nextTier}
            label={`Upgrade to ${nextTier} — $${billingInterval === "yearly" ? Math.round(PLAN_LIMITS[nextTier].priceYearly / 12) : PLAN_LIMITS[nextTier].priceMonthly}/mo`}
            onClick={() => handleUpgrade(nextTier)}
            loading={loadingCheckout === nextTier}
          />

          <p className="text-xs text-center text-white/30">
            Cancel anytime · Instant access · Secure checkout via Stripe
          </p>
        </div>
      )}

      {/* ── OTHER PLANS (collapsed) ─────────────────────────────── */}
      {upgradePlans.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">All Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upgradePlans.filter(t => t !== nextTier).map(planTier => {
              const plan = PLAN_LIMITS[planTier]
              const price = billingInterval === "yearly" ? Math.round(plan.priceYearly / 12) : plan.priceMonthly
              const isLoading = loadingCheckout === planTier
              const PlanIcon = TIER_ICONS[planTier] || Star
              return (
                <div key={planTier} className={`relative p-5 rounded-xl border bg-gradient-to-br ${TIER_BG[planTier]}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <PlanIcon className={`h-5 w-5 ${TIER_COLORS[planTier]}`} />
                      <div>
                        <p className={`text-sm font-bold ${TIER_COLORS[planTier]}`}>{planTier}</p>
                        <p className="text-xl font-bold text-white">${price}<span className="text-xs font-normal text-white/40">/mo</span></p>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {[
                      `${plan.apiRateLimit.toLocaleString()} req/hr`,
                      `${plan.storageGb} GB storage`,
                      `${plan.platformFeePct}% platform fee`,
                      plan.canUseCustomDomain ? "Custom domain" : plan.canUseAiUpload ? "AI upload" : null,
                    ].filter(Boolean).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                        <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(planTier)}
                    disabled={isLoading || !plan.stripePriceIdMonthly}
                    className={`w-full h-9 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                      planTier === "BUSINESS"
                        ? "bg-purple-500 text-white hover:bg-purple-400"
                        : "bg-white/[0.06] text-white hover:bg-white/[0.1] border border-white/[0.08]"
                    }`}
                  >
                    {isLoading ? "Redirecting..." : !plan.stripePriceIdMonthly ? "Coming Soon" : `Upgrade to ${planTier}`}
                    {!isLoading && plan.stripePriceIdMonthly && <ArrowUpRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── BILLING HISTORY ────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Billing History</h2>
          {hasStripe && (
            <button onClick={handlePortal} disabled={loadingPortal}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-amber-400 transition-colors">
              <Receipt className="h-3.5 w-3.5" /> Download all invoices
            </button>
          )}
        </div>
        {billingEvents.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {billingEvents.map((evt, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    evt.event_type.includes("failed") ? "bg-red-500/10" :
                    evt.event_type.includes("refund") ? "bg-amber-500/10" : "bg-emerald-500/10"
                  }`}>
                    <Receipt className={`h-4 w-4 ${
                      evt.event_type.includes("failed") ? "text-red-400" :
                      evt.event_type.includes("refund") ? "text-amber-400" : "text-emerald-400"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-white">{eventLabel(evt.event_type)}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {evt.created_at ? new Date(evt.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {evt.amount ? (
                    <p className={`text-sm font-semibold ${
                      evt.event_type.includes("failed") ? "text-red-400" :
                      evt.event_type.includes("refund") ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {evt.event_type.includes("refund") ? "−" : "+"}{formatAmount(evt.amount, evt.currency)}
                    </p>
                  ) : null}
                  <span className={`text-xs font-medium ${
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
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-10 w-10 text-white/10 mb-3" />
            <p className="text-sm text-white/40">No billing history yet</p>
            {tier === "FREE" && (
              <p className="text-xs text-white/30 mt-1">Upgrade to a paid plan to see invoices here.</p>
            )}
          </div>
        )}
      </div>

      {/* ── BUSINESS PLAN — NO UPGRADE ─────────────────────────── */}
      {tier === "BUSINESS" && (
        <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/[0.02] flex items-center gap-4">
          <Crown className="h-8 w-8 text-purple-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-400">You&apos;re on our highest tier</p>
            <p className="text-xs text-purple-400/70 mt-0.5">You have access to every feature on MidasAI. Need custom enterprise terms? Contact us.</p>
          </div>
          <Link href="mailto:enterprise@midasai.app"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-400 transition-colors flex-shrink-0">
            Contact Sales <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
