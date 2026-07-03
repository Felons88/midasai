"use client"

import Link from "next/link"
import { AlertTriangle, X, TrendingUp } from "lucide-react"

interface UsageBannerProps {
  feature: string
  used: number
  limit: number
  percentage: number
  onDismiss?: () => void
}

export function UsageBanner({ feature, used, limit, percentage, onDismiss }: UsageBannerProps) {
  const isLocked = percentage >= 100
  const isCritical = percentage >= 90
  const isWarning = percentage >= 75

  const severityStyles = isLocked
    ? "bg-red-500/10 border-red-500/20 text-red-400"
    : isCritical
      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
      : "bg-blue-500/10 border-blue-500/20 text-blue-400"

  const title = isLocked
    ? `${feature} limit reached`
    : isCritical
      ? `${feature} at ${percentage}% — upgrade before you hit the limit`
      : `${feature} at ${percentage}%`

  return (
    <div className={`rounded-xl border px-4 py-3 mb-4 ${severityStyles}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs opacity-80 mt-0.5">
                {used.toLocaleString()} of {limit === -1 ? "∞" : limit.toLocaleString()} used
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/account/billing"
                className="inline-flex items-center gap-1 text-xs font-semibold bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                <TrendingUp className="h-3 w-3" />
                Upgrade
              </Link>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="h-6 w-6 rounded hover:bg-white/10 flex items-center justify-center opacity-60 hover:opacity-100"
                  aria-label="Dismiss"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isLocked ? "bg-red-500" : isCritical ? "bg-amber-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
