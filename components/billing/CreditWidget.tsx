"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Coins, TrendingUp, Calendar, ChevronDown, ChevronUp, Zap } from "lucide-react"

export interface CreditWidgetData {
  balance: {
    monthlyCredits: number
    purchasedCredits: number
    bonusCredits: number
    totalUsed: number
    lifetimeUsed: number
    available: number
    resetAt: string | null
  }
  forecast: {
    dailyAverageCredits: number
    daysRemaining: number | null
    estimatedMonthlyCredits: number
    currentBalance: number
    monthlyCredits: number
  }
}

interface CreditWidgetProps {
  compact?: boolean
  tier?: string
  className?: string
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function CreditWidget({ compact = true, tier = "FREE", className = "" }: CreditWidgetProps) {
  const [data, setData] = useState<CreditWidgetData | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch("/api/billing/credits")
        if (!res.ok) throw new Error("Failed to load credits")
        const json = await res.json()
        if (mounted) {
          setData(json)
          setLoading(false)
        }
      } catch (err) {
        console.error("[CreditWidget] load error:", err)
        if (mounted) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 30_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 animate-pulse ${className}`}>
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 ${className}`}>
        <p className="text-xs text-white/40">Credits unavailable</p>
      </div>
    )
  }

  const { balance, forecast } = data
  const daysRemaining = forecast.daysRemaining ?? null
  const isLow = balance.available < balance.monthlyCredits * 0.2

  const usagePct = balance.monthlyCredits
    ? Math.round((balance.totalUsed / balance.monthlyCredits) * 100)
    : 0

  if (compact && !expanded) {
    return (
      <div
        className={`group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors cursor-pointer ${className}`}
        onClick={() => setExpanded(true)}
        role="button"
        aria-expanded={false}
        aria-label="Expand credit widget"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLow ? "bg-red-500/10" : "bg-amber-500/10"}`}>
              <Coins className={`h-4 w-4 ${isLow ? "text-red-400" : "text-amber-400"}`} />
            </div>
            <div>
              <p className="text-xs text-white/40">Credits</p>
              <p className="text-sm font-semibold text-white tabular-nums">
                {formatNumber(balance.available)}
                <span className="text-white/30 font-normal"> / {formatNumber(balance.monthlyCredits)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {daysRemaining !== null && (
              <span className={`text-[10px] px-2 py-1 rounded-full ${daysRemaining <= 7 ? "bg-red-500/10 text-red-400" : "bg-white/[0.06] text-white/50"}`}>
                {daysRemaining <= 0 ? "Depleted" : `${daysRemaining}d left`}
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
          </div>
        </div>

        <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isLow ? "bg-red-500" : usagePct >= 75 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(100, usagePct)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isLow ? "bg-red-500/10" : "bg-amber-500/10"}`}>
            <Coins className={`h-4 w-4 ${isLow ? "text-red-400" : "text-amber-400"}`} />
          </div>
          <div>
            <p className="text-xs text-white/40">Credit Wallet</p>
            <p className="text-sm font-semibold text-white tabular-nums">
              {formatNumber(balance.available)} <span className="text-white/30 font-normal">available</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="h-7 w-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60"
          aria-label="Collapse credit widget"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/40">Monthly allocation</span>
          <span className="text-white tabular-nums">{formatNumber(balance.monthlyCredits)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Purchased</span>
          <span className="text-white tabular-nums">{formatNumber(balance.purchasedCredits)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Bonus</span>
          <span className="text-white tabular-nums">{formatNumber(balance.bonusCredits)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Used</span>
          <span className="text-white tabular-nums">{formatNumber(balance.totalUsed)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Resets</span>
          <span className="text-white/60 tabular-nums">{formatDate(balance.resetAt)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-white/40" />
          <span className="text-xs text-white/40">Usage forecast</span>
        </div>
        <p className="text-sm text-white/80">
          {daysRemaining === null ? (
            "Not enough usage history yet."
          ) : daysRemaining <= 0 ? (
            <span className="text-red-400">Credits depleted. Upgrade or buy a pack.</span>
          ) : (
            <>
              About <strong className="text-white">{daysRemaining} days</strong> remaining at current usage.
            </>
          )}
        </p>
        {forecast.dailyAverageCredits > 0 && (
          <p className="text-xs text-white/40 mt-1">
            ~{formatNumber(forecast.dailyAverageCredits)} credits/day · ~{formatNumber(forecast.estimatedMonthlyCredits)}/mo
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href="/account/wallet"
          className="flex-1 text-center text-xs font-medium py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/[0.04] hover:text-white transition-colors"
        >
          Wallet
        </Link>
        <Link
          href="/account/billing"
          className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors flex items-center justify-center gap-1"
        >
          <Zap className="h-3 w-3" />
          Upgrade
        </Link>
      </div>
    </div>
  )
}
