"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Coins } from "lucide-react"

interface CreditPillProps {
  className?: string
}

export function CreditPill({ className = "" }: CreditPillProps) {
  const [available, setAvailable] = useState<number | null>(null)
  const [monthly, setMonthly] = useState<number | null>(null)
  const [low, setLow] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch("/api/billing/credits")
        if (!res.ok) throw new Error("Failed")
        const json = await res.json()
        if (mounted) {
          setAvailable(json.balance.available)
          setMonthly(json.balance.monthlyCredits)
          setLow(json.balance.available < json.balance.monthlyCredits * 0.2)
        }
      } catch {
        // silent
      }
    }
    load()
    const interval = setInterval(load, 30_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (available === null) return null

  function format(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    return n.toLocaleString()
  }

  return (
    <Link
      href="/account/wallet"
      className={`hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-medium transition-colors ${
        low
          ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/[0.15]"
          : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.04]"
      } ${className}`}
    >
      <Coins className="h-3.5 w-3.5" />
      <span className="tabular-nums">{format(available)}</span>
      {monthly && monthly > 0 && (
        <span className="text-white/30">/ {format(monthly)}</span>
      )}
    </Link>
  )
}
