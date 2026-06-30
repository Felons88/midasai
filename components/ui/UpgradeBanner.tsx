"use client"

import { useState } from "react"
import { X, ArrowRight, Zap, TrendingUp, Shield, Star } from "lucide-react"
import Link from "next/link"

interface UpgradeBannerProps {
  currentTier: string
  usagePct?: number        // 0-100
  storageUsedGb?: number
  storageLimitGb?: number
  variant?: "warning" | "upgrade" | "annual" | "feature"
  featureName?: string     // for "feature" variant
  dismissible?: boolean
  onDismiss?: () => void
}

const TIER_NEXT: Record<string, { name: string; price: string; key: string }> = {
  FREE:     { name: "Starter", price: "$19/mo", key: "STARTER" },
  STARTER:  { name: "Pro",     price: "$49/mo", key: "PRO" },
  PRO:      { name: "Business",price: "$149/mo",key: "BUSINESS" },
  BUSINESS: { name: "",        price: "",       key: "" },
}

export function UpgradeBanner({
  currentTier,
  usagePct = 0,
  storageUsedGb = 0,
  storageLimitGb = 1,
  variant = "upgrade",
  featureName,
  dismissible = true,
  onDismiss,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const next = TIER_NEXT[currentTier] || TIER_NEXT.FREE

  if (dismissed || !next.name) return null
  if (variant === "warning" && usagePct < 80) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // ── Warning variant (80%+ usage) ──────────────────────────────────────
  if (variant === "warning") {
    const isUrgent = usagePct >= 95
    return (
      <div className={`relative overflow-hidden rounded-xl border p-4 flex items-center gap-4 ${
        isUrgent
          ? "bg-red-500/10 border-red-500/30"
          : "bg-amber-500/10 border-amber-500/30"
      }`}>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUrgent ? "bg-red-500/20" : "bg-amber-500/20"
        }`}>
          <Zap className={`h-5 w-5 ${isUrgent ? "text-red-400" : "text-amber-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${isUrgent ? "text-red-300" : "text-amber-300"}`}>
            {isUrgent ? `Critical: ${usagePct}% of API quota used` : `${usagePct}% of API quota used`}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            Upgrade to {next.name} for {isUrgent ? "immediate" : "more"} headroom.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/developer/billing"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isUrgent ? "bg-red-500 text-white hover:bg-red-400" : "bg-amber-500 text-black hover:bg-amber-400"
            }`}>
            Upgrade
          </Link>
          {dismissible && (
            <button onClick={handleDismiss} className="p-1 text-white/30 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Annual discount variant ────────────────────────────────────────────
  if (variant === "annual") {
    const savings = { STARTER: 38, PRO: 98, BUSINESS: 298 }[currentTier] || 0
    if (!savings) return null
    return (
      <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 flex items-center gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
        <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Star className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-purple-300">Save ${savings}/year with annual billing</p>
          <p className="text-xs text-white/50 mt-0.5">Switch your {currentTier} plan to annual — same features, 17% off.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/developer/billing"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-400 transition-colors">
            Switch to Annual <ArrowRight className="h-3 w-3" />
          </Link>
          {dismissible && (
            <button onClick={handleDismiss} className="p-1 text-white/30 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Feature gate variant ──────────────────────────────────────────────
  if (variant === "feature" && featureName) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#07070b] pointer-events-none z-10" />
        <Shield className="h-8 w-8 text-amber-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-white mb-1">{featureName} — {next.name} only</p>
        <p className="text-xs text-white/40 mb-4">Upgrade to {next.name} ({next.price}) to unlock this feature.</p>
        <Link href="/developer/billing"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-colors">
          Unlock {featureName} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // ── Default upgrade variant ───────────────────────────────────────────
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent p-4 flex items-center gap-4">
      {/* Subtle shimmer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        <div className="absolute inset-y-0 -left-full w-1/3 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-shimmer" />
      </div>
      <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
        <TrendingUp className="h-5 w-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">
          Upgrade to {next.name} and unlock more power
        </p>
        <p className="text-xs text-white/50 mt-0.5">
          {next.price} · Lower fees, more API quota, advanced features
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/developer/billing"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-colors animate-pulse-subtle">
          Upgrade <ArrowRight className="h-3 w-3" />
        </Link>
        {dismissible && (
          <button onClick={handleDismiss} className="p-1 text-white/30 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Storage warning bar ────────────────────────────────────────────────────
export function StorageWarningBar({ usedGb, limitGb, tier }: { usedGb: number; limitGb: number; tier: string }) {
  const pct = limitGb > 0 ? Math.round((usedGb / limitGb) * 100) : 0
  if (pct < 70) return null
  const next = TIER_NEXT[tier]
  const isUrgent = pct >= 90

  return (
    <div className={`rounded-xl border p-4 ${isUrgent ? "bg-red-500/8 border-red-500/25" : "bg-amber-500/8 border-amber-500/25"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${isUrgent ? "text-red-400" : "text-amber-400"}`}>
          Storage {pct}% full
        </span>
        <span className="text-xs text-white/40">{usedGb.toFixed(1)} / {limitGb} GB</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full transition-all ${isUrgent ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      {next?.name && (
        <p className="text-xs text-white/40 mt-2">
          Upgrade to {next.name} for {TIER_NEXT[next.key || ""]?.name || "more"} storage.{" "}
          <Link href="/developer/billing" className="text-amber-400 hover:text-amber-300 font-semibold">Upgrade →</Link>
        </p>
      )}
    </div>
  )
}
