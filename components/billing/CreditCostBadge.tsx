"use client"

import { useEffect, useState } from "react"
import { Coins, Loader2 } from "lucide-react"

interface CreditCostBadgeProps {
  featureKey: string
  units?: number
  className?: string
}

export function CreditCostBadge({ featureKey, units = 1, className = "" }: CreditCostBadgeProps) {
  const [cost, setCost] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch(`/api/billing/pricing?featureKey=${encodeURIComponent(featureKey)}&units=${units}`)
        if (!res.ok) throw new Error("Failed to load pricing")
        const json = await res.json()
        if (mounted) {
          setCost(json.cost ?? 0)
          setLoading(false)
        }
      } catch (err) {
        console.error("[CreditCostBadge] load error:", err)
        if (mounted) setLoading(false)
      }
    }

    load()
  }, [featureKey, units])

  if (loading) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-white/40 ${className}`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading cost...
      </span>
    )
  }

  if (cost === null) return null

  return (
    <span className={`inline-flex items-center gap-1 text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded-full ${className}`}>
      <Coins className="h-3 w-3" />
      {cost === 0 ? "Free" : `${cost.toLocaleString()} credit${cost === 1 ? "" : "s"}`}
    </span>
  )
}
