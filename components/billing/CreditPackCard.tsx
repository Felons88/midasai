"use client"

import { useState } from "react"
import { Coins, Check, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreditPack {
  id: string
  name: string
  description: string | null
  credits: number
  price: number
  currency: string
  stripePriceId: string | null
  isPopular: boolean
}

interface CreditPackCardProps {
  pack: CreditPack
  onPurchase: (packId: string) => void
  loading?: boolean
}

export function CreditPackCard({ pack, onPurchase, loading }: CreditPackCardProps) {
  const handleClick = () => {
    if (pack.stripePriceId) {
      onPurchase(pack.id)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: pack.currency.toUpperCase(),
    }).format(price / 100)
  }

  const formatCredits = (credits: number) => {
    return credits.toLocaleString()
  }

  return (
    <div
      className={`relative rounded-2xl border p-5 flex flex-col transition-all hover:border-white/[0.12] ${
        pack.isPopular
          ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/5"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      {pack.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
          <Star className="h-3 w-3" />
          Popular
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`h-12 w-12 rounded-xl ${pack.isPopular ? "bg-amber-500/20" : "bg-white/[0.04]"} flex items-center justify-center`}>
          <Coins className={`h-6 w-6 ${pack.isPopular ? "text-amber-400" : "text-white/40"}`} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{pack.name}</h3>
          {pack.description && (
            <p className="text-xs text-white/40">{pack.description}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">{formatCredits(pack.credits)}</span>
          <span className="text-sm text-white/40">credits</span>
        </div>
      </div>

      <div className="mb-5">
        <span className="text-2xl font-bold text-white">{formatPrice(pack.price)}</span>
      </div>

      <ul className="space-y-2 mb-5 flex-1">
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
          <span>Instant credit delivery</span>
        </li>
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
          <span>No expiration date</span>
        </li>
        <li className="flex items-start gap-2 text-xs text-white/60">
          <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
          <span>Use across all AI features</span>
        </li>
      </ul>

      <Button
        onClick={handleClick}
        disabled={loading || !pack.stripePriceId}
        className="w-full"
        variant={pack.isPopular ? "default" : "outline"}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Purchase
            <Coins className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}
