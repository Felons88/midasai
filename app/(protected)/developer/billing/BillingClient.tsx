"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  CreditCard, Zap, HardDrive, Globe, BarChart3,
  CheckCircle, ArrowUpRight, ExternalLink,
  Shield, Star, Sparkles, TrendingUp, Download,
  RefreshCw, Crown, Rocket, Building2, ChevronRight,
  Receipt, Bell, X, AlertTriangle, Copy, Check,
  FileText, Eye,
} from "lucide-react"
import { PLAN_LIMITS, getPlanLimits, formatLimit, PlanTier, PLAN_ORDER } from "@/lib/subscriptions"
import type { StripeSetupStatus } from "@/lib/stripe/config"
import { StripeSetupBanner } from "@/components/billing/StripeSetupBanner"

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
    stripe_event_id: string | null
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

// ── Tier config ──────────────────────────────────────────────────────
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
const UPGRADE_CTA: Record<string, string> = {
  FREE:    "Upgrade to Starter",
  STARTER: "Upgrade to Pro",
  PRO:     "Upgrade to Business",
}
const UPGRADE_SUB: Record<string, string> = {
  FREE:    "Unlock more power and higher limits",
  STARTER: "Most popular · AI upload, custom domain",
  PRO:     "Enterprise-grade · Dedicated support",
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

function eventStatus(type: string): { label: string; cls: string } {
  if (type.includes("failed"))  return { label: "Failed",    cls: "text-red-400 bg-red-500/10 border-red-500/20" }
  if (type.includes("refund"))  return { label: "Refunded",  cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
  if (type.includes("cancel"))  return { label: "Cancelled", cls: "text-orange-400 bg-orange-500/10 border-orange-500/20" }
  return { label: "Paid", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (!amount) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: currency || "usd", minimumFractionDigits: 2,
  }).format(amount / 100)
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
          <div className={`h-full rounded-full transition-all duration-700 ${isCritical ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

// Animated upgrade button with shimmer + pulse
function UpgradeButton({ tier, label, onClick, loading }: {
  tier: PlanTier; label: string; onClick: () => void; loading: boolean
}) {
  const [shimmer, setShimmer] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    // Shimmer every 3.5s
    const shimId = setInterval(() => {
      setShimmer(true)
      setTimeout(() => setShimmer(false), 900)
    }, 3500)
    // Subtle pulse every 18s
    const pulseId = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    }, 18000)
    return () => { clearInterval(shimId); clearInterval(pulseId) }
  }, [])

  const colors: Record<PlanTier, string> = {
    FREE:     "from-white/10 to-white/5 border-white/20 text-white",
    STARTER:  "from-blue-500 to-blue-600 border-blue-400/50 text-white shadow-blue-500/25",
    PRO:      "from-amber-500 to-amber-600 border-amber-400/50 text-black shadow-amber-500/35",
    BUSINESS: "from-purple-500 to-purple-600 border-purple-400/50 text-white shadow-purple-500/25",
  }

  return (
    <button onClick={onClick} disabled={loading}
      className={`relative w-full h-12 rounded-xl bg-gradient-to-r ${colors[tier]} border font-bold text-sm shadow-lg
        transition-all duration-300 hover:scale-[1.015] hover:shadow-xl active:scale-[0.985]
        disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden
        ${pulse ? "scale-[1.01]" : ""}`}
    >
      {shimmer && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_0.9s_ease-in-out]" />
      )}
      <span className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none" />
      <span className="relative flex items-center justify-center gap-2.5">
        <Sparkles className="h-4 w-4" />
        {loading ? "Redirecting to checkout…" : label}
        {!loading && <ChevronRight className="h-3.5 w-3.5" />}
      </span>
    </button>
  )
}

// Cancel/Reactivate confirmation modal
function CancelModal({ onClose, onConfirm, loading, periodEnd, willCancel }: {
  onClose: () => void; onConfirm: () => void; loading: boolean
  periodEnd: string | null; willCancel: boolean | null
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d14] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>

        {willCancel ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reactivate Subscription</h3>
                <p className="text-xs text-white/40">Resume your plan before it expires</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Your subscription is currently set to cancel. Reactivating will resume automatic billing and restore full access.
            </p>
            {periodEnd && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-sm text-emerald-400 mb-5">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Access continues until {periodEnd}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors">
                Keep cancelled
              </button>
              <button onClick={onConfirm} disabled={loading}
                className="flex-1 h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50">
                {loading ? "Processing…" : "Reactivate"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cancel Subscription</h3>
                <p className="text-xs text-white/40">You can reactivate before the period ends</p>
              </div>
            </div>
            <ul className="space-y-2 mb-4">
              {[
                "Your plan stays active until the current period ends",
                "You will lose access to paid features after that date",
                "All your data and listings will be preserved",
                "You can reactivate anytime before expiry",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-white/60">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/30 flex-shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
            {periodEnd && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-sm text-amber-400 mb-5">
                <Bell className="h-4 w-4 flex-shrink-0" />
                Access ends {periodEnd}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors">
                Keep my plan
              </button>
              <button onClick={onConfirm} disabled={loading}
                className="flex-1 h-10 rounded-xl bg-red-500/80 text-white text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50">
                {loading ? "Processing…" : "Cancel subscription"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Invoice detail modal
function InvoiceModal({ evt, onClose }: {
  evt: BillingData["billingEvents"][number]; onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const meta = evt.metadata || {}
  const hostedUrl = meta.hosted_invoice_url as string | undefined
  const pdfUrl = meta.invoice_pdf as string | undefined
  const invoiceNum = meta.invoice_number as string | undefined
  const { label: statusLabel, cls: statusCls } = eventStatus(evt.event_type)

  const copyLink = useCallback(async () => {
    const url = hostedUrl || ""
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [hostedUrl])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0d0d14] p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Invoice Details</h3>
            {invoiceNum && <p className="text-xs text-white/40">{invoiceNum}</p>}
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {[
            { label: "Description",  value: eventLabel(evt.event_type) },
            { label: "Date",         value: evt.created_at ? new Date(evt.created_at).toLocaleDateString("en-US", { dateStyle: "long" }) : "—" },
            { label: "Amount",       value: formatAmount(evt.amount, evt.currency) },
            { label: "Status",       value: statusLabel, cls: statusCls },
            invoiceNum ? { label: "Invoice #", value: invoiceNum } : null,
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
              <span className="text-sm text-white/40">{row.label}</span>
              {row.cls ? (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${row.cls}`}>{row.value}</span>
              ) : (
                <span className="text-sm text-white font-medium">{row.value}</span>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </a>
          )}
          {hostedUrl && (
            <a href={hostedUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors">
              <Eye className="h-3.5 w-3.5" /> View Invoice
            </a>
          )}
          {hostedUrl && (
            <button onClick={copyLink}
              className="flex items-center justify-center gap-2 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors col-span-2">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Link copied!" : "Copy invoice link"}
            </button>
          )}
          {!pdfUrl && !hostedUrl && (
            <p className="col-span-2 text-center text-sm text-white/30 py-2">No invoice documents available for this event.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BillingClient({
  data,
  stripeSetup,
}: {
  data: BillingData
  stripeSetup: StripeSetupStatus
}) {
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<BillingData["billingEvents"][number] | null>(null)

  const tier = (data.subscription?.tier || "FREE") as PlanTier
  const limits = getPlanLimits(tier)
  const { usage, billingEvents } = data
  const TierIcon = TIER_ICONS[tier] || Star
  const isActive = data.subscription?.status === "ACTIVE"
  const willCancel = data.subscription?.cancel_at_period_end
  const periodEnd = data.subscription?.current_period_end
    ? new Date(data.subscription.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null
  const nextTier = NEXT_TIER[tier]
  const hasStripe = !!data.subscription?.stripe_subscription_id
  const apiLimit = limits.apiRateLimit * 24 * 30
  const apiPct = apiLimit > 0 ? (usage.apiRequestsMonth / apiLimit) * 100 : 0
  const storagePct = limits.storageGb > 0 ? (usage.storageGbUsed / limits.storageGb) * 100 : 0

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

  const handleCancelConfirm = async () => {
    setCancelLoading(true)
    try {
      // Stripe customer portal handles cancel/reactivate
      const res = await fetch("/api/stripe/customer-portal", { method: "POST" })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else alert(json.error || "Could not open portal")
    } finally {
      setCancelLoading(false)
      setShowCancelModal(false)
    }
  }

  // Only show invoice-type events in the table
  const invoiceEvents = billingEvents.filter(e =>
    ["invoice.paid", "invoice.payment_failed", "charge.refunded", "subscription.created"].includes(e.event_type)
  )

  return (
    <div className="max-w-5xl mx-auto px-2 py-6 space-y-6">
      <StripeSetupBanner status={stripeSetup} />

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing &amp; Plan</h1>
          <p className="text-sm text-white/40 mt-0.5">Manage your subscription, usage, and invoices.</p>
        </div>
        {hasStripe && (
          <button onClick={handlePortal} disabled={loadingPortal}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50">
            <ExternalLink className="h-3.5 w-3.5" />
            {loadingPortal ? "Opening…" : "Stripe Portal"}
          </button>
        )}
      </div>

      {/* ── TOP ROW: Current Plan + Billing Summary ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Current Plan card (spans 3/5) */}
        <div className={`lg:col-span-3 rounded-2xl bg-gradient-to-br ${TIER_BG[tier]} border p-6 flex flex-col gap-5`}>
          {/* Plan identity row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                tier === "PRO" ? "bg-amber-500/20" : tier === "BUSINESS" ? "bg-purple-500/20" :
                tier === "STARTER" ? "bg-blue-500/20" : "bg-white/[0.06]"
              }`}>
                <TierIcon className={`h-6 w-6 ${TIER_COLORS[tier]}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white">
                    {tier.charAt(0) + tier.slice(1).toLowerCase()} Plan
                  </h2>
                  {isActive && !willCancel && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                  {willCancel && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-semibold">
                      Cancels {periodEnd}
                    </span>
                  )}
                </div>
                <p className={`text-2xl font-bold mt-0.5 ${TIER_COLORS[tier]}`}>
                  ${limits.priceMonthly}
                  <span className="text-sm font-normal text-white/30">/mo</span>
                </p>
                {periodEnd && !willCancel && (
                  <p className="text-xs text-white/35 mt-0.5">Renews {periodEnd}</p>
                )}
              </div>
            </div>

            {/* Inline upgrade CTA */}
            {nextTier && (
              <div className="flex-shrink-0 hidden sm:flex flex-col items-end gap-2">
                <UpgradeButton
                  tier={nextTier}
                  label={UPGRADE_CTA[tier]}
                  onClick={() => handleUpgrade(nextTier)}
                  loading={loadingCheckout === nextTier}
                />
                <p className="text-[10px] text-white/30 text-right max-w-[160px]">{UPGRADE_SUB[tier]}</p>
              </div>
            )}
          </div>

          {/* Usage bars */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-semibold text-white/35 uppercase tracking-wider">Monthly Usage</h3>
              {(apiPct > 80 || storagePct > 80) && (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <Bell className="h-3 w-3" /> Usage warning
                </span>
              )}
            </div>
            <UsageBar label="API Requests" used={usage.apiRequestsMonth} total={apiLimit} warn={apiPct > 80} />
            <UsageBar label="Storage" used={Math.round(usage.storageGbUsed * 100) / 100} total={limits.storageGb} unit=" GB" warn={storagePct > 80} />
            <div className="grid grid-cols-2 gap-4">
              <UsageBar label="API Keys" used={usage.activeApiKeys} total={3} />
              <UsageBar label="Webhooks" used={usage.webhooks} total={limits.maxWebhooks} />
            </div>
          </div>

          {/* Plan perks */}
          <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-white/[0.06]">
            {[
              { icon: Zap,       label: "Rate Limit",   value: `${limits.apiRateLimit.toLocaleString()}/hr` },
              { icon: HardDrive, label: "Storage",       value: `${limits.storageGb} GB` },
              { icon: Shield,    label: "Platform Fee",  value: `${limits.platformFeePct}%` },
              { icon: BarChart3, label: "Analytics",     value: limits.analyticsTier },
              { icon: Globe,     label: "Custom Domain", value: limits.canUseCustomDomain ? "Included" : "Not included" },
              { icon: Star,      label: "Featured",      value: formatLimit(limits.maxFeaturedListings) + " slots" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Icon className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-white/35 uppercase tracking-wide truncate">{label}</p>
                  <p className="text-xs font-semibold text-white capitalize truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile upgrade CTA */}
          {nextTier && (
            <div className="sm:hidden">
              <UpgradeButton
                tier={nextTier}
                label={UPGRADE_CTA[tier]}
                onClick={() => handleUpgrade(nextTier)}
                loading={loadingCheckout === nextTier}
              />
              <p className="text-[10px] text-white/30 text-center mt-1.5">{UPGRADE_SUB[tier]}</p>
            </div>
          )}

          {/* Cancel/Reactivate */}
          {hasStripe && tier !== "FREE" && (
            <div className="pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setShowCancelModal(true)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                  willCancel
                    ? "text-emerald-400/60 hover:text-emerald-400"
                    : "text-red-400/50 hover:text-red-400"
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {willCancel ? "Reactivate subscription" : "Cancel subscription"}
              </button>
            </div>
          )}
        </div>

        {/* Billing Summary card (spans 2/5) */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Billing Summary</h2>

          {/* Interval toggle */}
          {nextTier && (
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <button onClick={() => setBillingInterval("monthly")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${billingInterval === "monthly" ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white"}`}>
                Monthly
              </button>
              <button onClick={() => setBillingInterval("yearly")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${billingInterval === "yearly" ? "bg-amber-500 text-black" : "text-white/40 hover:text-white"}`}>
                Annual
                <span className={billingInterval === "yearly" ? "text-black/60 text-[10px]" : "text-emerald-400 text-[10px]"}>-17%</span>
              </button>
            </div>
          )}

          {/* Next plan preview */}
          {nextTier && (
            <>
              <div className="space-y-2">
                <p className="text-xs text-white/35 uppercase tracking-wide">Next plan</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-white">
                    ${billingInterval === "yearly"
                      ? Math.round(PLAN_LIMITS[nextTier].priceYearly / 12)
                      : PLAN_LIMITS[nextTier].priceMonthly}
                  </span>
                  <span className="text-sm text-white/35">/month</span>
                </div>
                {billingInterval === "yearly" && (
                  <p className="text-xs text-emerald-400">${PLAN_LIMITS[nextTier].priceYearly} billed annually</p>
                )}
              </div>

              <div className="space-y-2">
                {[
                  { icon: Zap,        label: `${PLAN_LIMITS[nextTier].apiRateLimit.toLocaleString()} API req/hr`, sub: `↑ from ${limits.apiRateLimit.toLocaleString()}` },
                  { icon: HardDrive,  label: `${PLAN_LIMITS[nextTier].storageGb} GB storage`,                    sub: `↑ from ${limits.storageGb} GB` },
                  { icon: TrendingUp, label: `${PLAN_LIMITS[nextTier].platformFeePct}% platform fee`,            sub: `↓ from ${limits.platformFeePct}%` },
                  { icon: CheckCircle,label: PLAN_LIMITS[nextTier].canUseCustomDomain ? "Custom domain" : PLAN_LIMITS[nextTier].canUseAiUpload ? "AI upload assistant" : "Priority support", sub: "Newly included" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-white/80">{label}</p>
                      <p className="text-[10px] text-white/35">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <UpgradeButton
                tier={nextTier}
                label={`${UPGRADE_CTA[tier]} — $${billingInterval === "yearly" ? Math.round(PLAN_LIMITS[nextTier].priceYearly / 12) : PLAN_LIMITS[nextTier].priceMonthly}/mo`}
                onClick={() => handleUpgrade(nextTier)}
                loading={loadingCheckout === nextTier}
              />

              <p className="text-[10px] text-center text-white/25">
                Cancel anytime · Instant access · Stripe checkout
              </p>
            </>
          )}

          {/* Business — no upgrade */}
          {tier === "BUSINESS" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <Crown className="h-8 w-8 text-purple-400" />
              <p className="text-sm font-semibold text-purple-400">Highest tier</p>
              <p className="text-xs text-purple-400/60">You have access to everything. Need enterprise terms?</p>
              <Link href="mailto:enterprise@midasai.app"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-semibold hover:bg-purple-400 transition-colors">
                Contact Sales <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Payment method shortcut */}
          {hasStripe && (
            <button onClick={handlePortal} disabled={loadingPortal}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors w-full">
              <CreditCard className="h-3.5 w-3.5" />
              Update payment method
            </button>
          )}
        </div>
      </div>

      {/* ── BILLING HISTORY (full-width) ────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Billing History</h2>
          {hasStripe && (
            <button onClick={handlePortal} disabled={loadingPortal}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-amber-400 transition-colors">
              <Receipt className="h-3.5 w-3.5" /> Manage in Stripe
            </button>
          )}
        </div>

        {invoiceEvents.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Invoice", "Date", "Amount", "Status", "Method", "Actions"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {invoiceEvents.map((evt, i) => {
                    const meta = evt.metadata || {}
                    const invoiceNum = meta.invoice_number as string | undefined
                    const pdfUrl = meta.invoice_pdf as string | undefined
                    const hostedUrl = meta.hosted_invoice_url as string | undefined
                    const { label: statusLabel, cls: statusCls } = eventStatus(evt.event_type)
                    return (
                      <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${evt.event_type.includes("failed") ? "bg-red-500/10" : evt.event_type.includes("refund") ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                              <Receipt className={`h-3.5 w-3.5 ${evt.event_type.includes("failed") ? "text-red-400" : evt.event_type.includes("refund") ? "text-amber-400" : "text-emerald-400"}`} />
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">{invoiceNum || "—"}</p>
                              <p className="text-[11px] text-white/35">{eventLabel(evt.event_type)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-white/60">
                          {evt.created_at ? new Date(evt.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-semibold ${evt.event_type.includes("failed") ? "text-red-400" : evt.event_type.includes("refund") ? "text-amber-400" : "text-white"}`}>
                            {formatAmount(evt.amount, evt.currency)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusCls}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-white/40">
                          {(meta.payment_method_type as string | undefined) || "Card"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedInvoice(evt)}
                              className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                            {pdfUrl && (
                              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-white/40 hover:text-amber-400 transition-colors">
                                <Download className="h-3.5 w-3.5" /> PDF
                              </a>
                            )}
                            {hostedUrl && (
                              <a href={hostedUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition-colors">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {invoiceEvents.map((evt, i) => {
                const meta = evt.metadata || {}
                const invoiceNum = meta.invoice_number as string | undefined
                const pdfUrl = meta.invoice_pdf as string | undefined
                const hostedUrl = meta.hosted_invoice_url as string | undefined
                const { label: statusLabel, cls: statusCls } = eventStatus(evt.event_type)
                return (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{invoiceNum || eventLabel(evt.event_type)}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {evt.created_at ? new Date(evt.created_at).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold ${evt.event_type.includes("failed") ? "text-red-400" : evt.event_type.includes("refund") ? "text-amber-400" : "text-white"}`}>
                          {formatAmount(evt.amount, evt.currency)}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusCls}`}>{statusLabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedInvoice(evt)}
                        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                        <Eye className="h-3 w-3" /> Details
                      </button>
                      {pdfUrl && (
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-400 border border-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                          <Download className="h-3 w-3" /> PDF
                        </a>
                      )}
                      {hostedUrl && (
                        <a href={hostedUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white border border-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                          <ExternalLink className="h-3 w-3" /> Open
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <FileText className="h-6 w-6 text-white/15" />
            </div>
            <p className="text-sm font-medium text-white/40">No invoices yet</p>
            <p className="text-xs text-white/25 max-w-xs">
              When your first payment is processed, invoices will appear here with full details and download options.
            </p>
            {tier === "FREE" && nextTier && (
              <button onClick={() => handleUpgrade(nextTier)}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors">
                <Sparkles className="h-3.5 w-3.5" /> {UPGRADE_CTA[tier]} to get started
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCancelModal && (
        <CancelModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
          loading={cancelLoading}
          periodEnd={periodEnd}
          willCancel={willCancel ?? null}
        />
      )}
      {selectedInvoice && (
        <InvoiceModal evt={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
    </div>
  )
}
