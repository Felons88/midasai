"use client"

import { useState } from "react"
import Link from "next/link"
import { Lock, X, Check, ArrowUpRight, Sparkles } from "lucide-react"

interface FeatureLockOverlayProps {
  featureName: string
  description: string
  benefits: string[]
  productivityGain?: string
  recommendedTier?: string
  onClose?: () => void
}

export function FeatureLockOverlay({
  featureName,
  description,
  benefits,
  productivityGain,
  recommendedTier = "PRO",
  onClose,
}: FeatureLockOverlayProps) {
  const [closing, setClosing] = useState(false)

  function handleClose() {
    setClosing(true)
    setTimeout(() => onClose?.(), 200)
  }

  if (closing) return null

  return (
    <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[#111118] to-[#111118] p-6 overflow-hidden">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 h-7 w-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="relative flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Lock className="h-6 w-6 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1">{featureName}</h3>
          <p className="text-sm text-white/50 mb-4">{description}</p>

          <ul className="space-y-2 mb-4">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>

          {productivityGain && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-white/70">
                Estimated productivity improvement: <span className="text-amber-400 font-semibold">{productivityGain}</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link
              href="/account/billing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              Upgrade to {recommendedTier}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
