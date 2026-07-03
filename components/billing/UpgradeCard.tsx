"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Crown, ArrowUpRight, TrendingUp } from "lucide-react"

interface UpgradeCardProps {
  title: string
  description: string
  recommendedTier?: string
  reason?: string
  cta?: string
  href?: string
  onDismiss?: () => void
  variant?: "sidebar" | "dashboard" | "banner"
}

export function UpgradeCard({
  title,
  description,
  recommendedTier = "PRO",
  reason,
  cta = "Upgrade",
  href = "/account/billing",
  onDismiss,
  variant = "sidebar",
}: UpgradeCardProps) {
  const [dismissing, setDismissing] = useState(false)

  function handleDismiss(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDismissing(true)
    setTimeout(() => onDismiss?.(), 200)
  }

  if (dismissing) return null

  const isBanner = variant === "banner"
  const isDashboard = variant === "dashboard"

  return (
    <div
      className={`relative overflow-hidden border border-white/[0.08] bg-gradient-to-br from-amber-500/10 via-[#111118] to-[#111118] ${
        isBanner
          ? "rounded-xl px-4 py-3"
          : "rounded-xl p-4"
      }`}
    >
      {/* Glow accent */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="relative flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Crown className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white leading-tight">{title}</p>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="h-5 w-5 rounded hover:bg-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{description}</p>
          {reason && (
            <p className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {reason}
            </p>
          )}
          <Link
            href={href}
            className={`inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-black bg-amber-500 hover:bg-amber-400 transition-colors rounded-lg ${
              isBanner ? "px-2.5 py-1" : "px-3 py-1.5"
            }`}
          >
            {cta}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
          {isDashboard && (
            <p className="text-[10px] text-white/30 mt-2">
              Recommended: <span className="text-amber-400">{recommendedTier}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
