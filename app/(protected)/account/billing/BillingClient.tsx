"use client"

import Link from "next/link"
import {
  CreditCard, Download, Star, Rocket, Crown, Building2,
  Check, Zap, HardDrive, Globe, BarChart3, Shield,
  ArrowUpRight, Loader2, Receipt, Wallet, AlertTriangle,
  Calendar, RefreshCw
} from "lucide-react"
import { useState } from "react"
import { UpgradeButton } from "@/components/billing/UpgradeButton"
import { PLAN_LIMITS, type PlanTier } from "@/lib/subscriptions"
import type { BillingContext } from "@/lib/billing/entitlements"

interface BillingClientProps {
  context: BillingContext
  subscription: {
    tier: string | null
    status: string | null
    current_period_end: string | null
    current_period_start: string | null
    cancel_at_period_end: boolean | null
    stripe_subscription_id: string | null
  } | null
}

const TIER_CONFIG: Record<PlanTier, { icon: React.ElementType; color: string; bg: string; gradient: string; border: string }> = {
  FREE: {
    icon: Star,
    color: "text-white/70",
    bg: "bg-white/[0.03]",
    gradient: "from-white/[0.05] to-white/[0.01]",
    border: "border-white/[0.08]",
  },
  PRO: {
    icon: Rocket,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    gradient: "from-amber-500/15 to-amber-600/5",
    border: "border-amber-500/20",
  },
  TEAM: {
    icon: Crown,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    gradient: "from-blue-500/15 to-blue-600/5",
    border: "border-blue-500/20",
  },
  ENTERPRISE: {
    icon: Building2,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    gradient: "from-purple-500/15 to-purple-600/5",
    border: "border-purple-500/20",
  },
}

const TIER_DESCRIPTION: Record<PlanTier, string> = {
  FREE: "Discover and try MidasAI with essential limits.",
  PRO: "For individual developers who need more power and AI features.",
  TEAM: "For small teams and startups (up to 10 seats).",
  ENTERPRISE: "For companies needing custom contracts, SLAs, and dedicated support.",
}

const TIER_ORDER: PlanTier[] = ["FREE", "PRO", "TEAM", "ENTERPRISE"]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatPrice(price: number): string {
  return price === 0 ? "Free" : `$${price}`
}

function UsageBar({
  label,
  used,
  max,
  icon: Icon,
}: {
  label: string
  used: number
  max: number
  icon: React.ElementType
}) {
  const unlimited = max === -1
  const pct = unlimited ? 0 : max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0
  const isWarn = !unlimited && pct >= 80
  const isCritical = !unlimited && pct >= 95

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/60">{label}</span>
          <span className={`text-xs font-semibold tabular-nums ${isCritical ? "text-red-400" : isWarn ? "text-amber-400" : "text-white/50"}`}>
            {unlimited ? `${used} / ∞` : `${used} / ${max}`}
            {!unlimited && <span className="text-white/30 font-normal ml-1">{pct}%</span>}
          </span>
        </div>
        {!unlimited && (
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isCritical ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {unlimited && (
          <div className="h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
            <div className="h-full w-full rounded-full bg-emerald-500/40" />
          </div>
        )}
      </div>
    </div>
  )
}

function PlanCard({
  tier,
  current,
  onUpgrade,
  loading,
}: {
  tier: PlanTier
  current: boolean
  onUpgrade?: (tier: PlanTier) => void
  loading?: boolean
}) {
  const config = TIER_CONFIG[tier]
  const Icon = config.icon
  const plan = PLAN_LIMITS[tier]
  const isDowngrade = false

  return (
    <div
      className={`relative rounded-2xl border ${current ? config.border : "border-white/[0.06]"} bg-gradient-to-br ${
        current ? config.gradient : "from-white/[0.03] to-white/[0.01]"
      } p-5 flex flex-col transition-all hover:border-white/[0.12]`}
    >
      {current && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
          Current Plan
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-xl ${config.bg} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{tier.charAt(0) + tier.slice(1).toLowerCase()}</h3>
          <p className="text-[11px] text-white/40">{tier === "ENTERPRISE" ? "Custom pricing" : "Monthly plan"}</p>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-2xl font-bold text-white">{formatPrice(plan.priceMonthly)}</span>
        {plan.priceMonthly > 0 && <span className="text-sm text-white/40">/mo</span>}
      </div>

      <ul className="space-y-2.5 mb-5 flex-1">
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
          {plan.maxDownloadsPerMonth === -1 ? "Unlimited downloads" : `${plan.maxDownloadsPerMonth} downloads/mo`}
        </li>
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
          {plan.maxListings === -1 ? "Unlimited listings" : `${plan.maxListings} listings`}
        </li>
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
          {plan.maxApiKeys === -1 ? "Unlimited API keys" : `${plan.maxApiKeys} API keys`}
        </li>
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
          {plan.maxWebhooks === -1 ? "Unlimited webhooks" : `${plan.maxWebhooks} webhooks`}
        </li>
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
          {plan.storageGb === -1 ? "Unlimited storage" : `${plan.storageGb} GB storage`}
        </li>
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
          {plan.apiRateLimit === -1 ? "Unlimited API rate" : `${plan.apiRateLimit.toLocaleString()} req/hr`}
        </li>
        {tier === "TEAM" && (
          <li className="flex items-start gap-2 text-xs text-white/60">
            <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
            Up to 10 team seats
          </li>
        )}
      </ul>

      {current ? (
        <button disabled className="w-full h-10 rounded-xl bg-white/[0.06] text-white/40 text-sm font-semibold cursor-default">
          Current Plan
        </button>
      ) : tier === "ENTERPRISE" ? (
        <Link
          href="mailto:enterprise@midasai.app"
          className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold transition-colors"
        >
          Contact Sales <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <button
          onClick={() => onUpgrade?.(tier)}
          disabled={loading}
          className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
            Upgrade <ArrowUpRight className="h-3.5 w-3.5" />
          </>}
        </button>
      )}
    </div>
  )
}

export default function BillingClient({ context, subscription }: BillingClientProps) {
  const { limits, usage } = context
  const tier = limits.tier
  const config = TIER_CONFIG[tier]
  const Icon = config.icon
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null)

  const handleUpgrade = async (targetTier: PlanTier) => {
    setLoadingTier(targetTier)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: targetTier, interval: "monthly" }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("Checkout failed:", data)
        alert(`Checkout failed: ${data.error || "Unknown error"}`)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error"
      console.error("Upgrade error:", e)
      alert(`Checkout error: ${message}`)
    } finally {
      setLoadingTier(null)
    }
  }

  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING"
  const willCancel = subscription?.cancel_at_period_end
  const periodEnd = subscription?.current_period_end

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
        <p className="text-sm text-white/40">Manage your plan, usage, and payment settings</p>
      </div>

      {/* Current plan highlight */}
      <div className={`rounded-2xl border ${config.border} bg-gradient-to-br ${config.gradient} p-6 lg:p-8 mb-6`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-2xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-7 w-7 ${config.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-white">{tier.charAt(0) + tier.slice(1).toLowerCase()} Plan</h2>
                {isActive && !willCancel && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400">
                    Active
                  </span>
                )}
                {willCancel && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-[11px] font-semibold text-amber-400">
                    Cancels {formatDate(periodEnd)}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/50 max-w-md">{TIER_DESCRIPTION[tier]}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:text-right">
            <div>
              <p className="text-3xl font-bold text-white">
                {formatPrice(PLAN_LIMITS[tier].priceMonthly)}
                {PLAN_LIMITS[tier].priceMonthly > 0 && <span className="text-base font-normal text-white/40">/mo</span>}
              </p>
              {periodEnd && (
                <p className="text-xs text-white/40 flex items-center gap-1 lg:justify-end mt-1">
                  <Calendar className="h-3 w-3" />
                  {willCancel ? "Access until" : "Renews on"} {formatDate(periodEnd)}
                </p>
              )}
            </div>
            {tier !== "ENTERPRISE" && (
              <UpgradeButton
                tier={tier === "FREE" ? "PRO" : tier === "PRO" ? "TEAM" : "ENTERPRISE"}
                label={tier === "FREE" ? "Upgrade to Pro" : tier === "PRO" ? "Upgrade to Team" : "Contact Sales"}
              />
            )}
          </div>
        </div>

        {subscription?.stripe_subscription_id && tier !== "FREE" && (
          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center gap-2 text-xs text-white/40">
            <RefreshCw className="h-3.5 w-3.5" />
            Subscription ID: <span className="font-mono text-white/60">{subscription.stripe_subscription_id}</span>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/account/wallet" className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Wallet</p>
            <p className="text-xs text-white/40">Credits & transactions</p>
          </div>
        </Link>
        <Link href="/account/settings" className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Account Settings</p>
            <p className="text-xs text-white/40">Manage profile & preferences</p>
          </div>
        </Link>
        <Link href="/developer/keys" className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">API Keys</p>
            <p className="text-xs text-white/40">Manage integrations</p>
          </div>
        </Link>
        <Link href="/support" className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Support</p>
            <p className="text-xs text-white/40">Billing questions</p>
          </div>
        </Link>
      </div>

      {/* Usage + plan comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Usage */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white">Usage This Period</h3>
            </div>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Resets monthly</span>
          </div>
          <div className="px-5 py-3">
            <UsageBar label="Downloads" used={usage.downloadsThisMonth} max={limits.maxDownloadsPerMonth} icon={Download} />
            <UsageBar label="Listings" used={usage.listings} max={limits.maxListings} icon={Globe} />
            <UsageBar label="API Keys" used={usage.apiKeys} max={limits.maxApiKeys} icon={Zap} />
            <UsageBar label="Webhooks" used={usage.webhooks} max={limits.maxWebhooks} icon={HardDrive} />
            <UsageBar label="MCP Connections" used={usage.mcpServers} max={limits.maxMcpServers} icon={CreditCard} />
          </div>
          {limits.maxDownloadsPerMonth !== -1 && usage.downloadsThisMonth >= limits.maxDownloadsPerMonth * 0.8 && (
            <div className="px-5 py-3 bg-amber-500/5 border-t border-white/[0.04] flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/80">You&apos;re approaching your monthly download limit. Consider upgrading for unlimited access.</p>
            </div>
          )}
        </div>

        {/* Plan comparison */}
        <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.05]">
            <Rocket className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Available Plans</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIER_ORDER.map((t) => (
              <PlanCard
                key={t}
                tier={t}
                current={t === tier}
                onUpgrade={handleUpgrade}
                loading={loadingTier === t}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Payment + invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white">Payment Methods</h3>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <div className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white/30" />
            </div>
            <div>
              <p className="text-sm text-white/70">Stripe Checkout</p>
              <p className="text-xs text-white/40">Secure payments handled by Stripe. Manage cards in the Stripe customer portal.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white">Invoices</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <Receipt className="h-8 w-8 text-white/10" />
            <p className="text-sm text-white/40">Purchase receipts are emailed by Stripe after checkout.</p>
            <p className="text-xs text-white/30">Subscription invoices will appear here once billing is active.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
