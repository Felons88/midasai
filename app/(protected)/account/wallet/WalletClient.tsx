"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Coins, ArrowDownLeft, ArrowUpRight, Wallet, Gift,
  TrendingUp, Search, Calendar, Zap, CreditCard,
  Hourglass, CheckCircle2, XCircle
} from "lucide-react"

interface WalletClientProps {
  balance: {
    monthlyCredits: number
    monthlyCap: number
    dailyAllowance: number
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
    monthlyCap: number
    dailyAllowance: number
  }
  transactions: any[]
  reservations: any[]
}

const typeLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  monthly_allocation: { label: "Monthly", color: "text-blue-400", icon: Calendar },
  purchase: { label: "Purchase", color: "text-emerald-400", icon: CreditCard },
  bonus: { label: "Bonus", color: "text-purple-400", icon: Gift },
  admin_adjustment: { label: "Admin", color: "text-amber-400", icon: Zap },
  reservation: { label: "Reserved", color: "text-white/50", icon: Hourglass },
  capture: { label: "Used", color: "text-red-400", icon: ArrowUpRight },
  refund: { label: "Refund", color: "text-emerald-400", icon: ArrowDownLeft },
}

export function WalletClient({ balance, forecast, transactions, reservations }: WalletClientProps) {
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = transactions.filter((tx) => {
    const matchesType = filter === "all" || tx.type === filter
    const matchesSearch = !search || tx.description?.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  function formatNumber(n: number) {
    return n.toLocaleString()
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Usage Wallet</h1>
        <p className="text-white/50 text-sm">Credits, transactions, and forecast</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Available</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{formatNumber(balance.available)}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Monthly</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{formatNumber(balance.monthlyCredits)}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Purchased</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{formatNumber(balance.purchasedCredits)}</p>
        </div>
      </div>

      {/* Forecast */}
      <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">Usage Forecast</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-white/40">Daily allowance</p>
            <p className="text-white font-medium tabular-nums">{formatNumber(balance.dailyAllowance)} credits</p>
          </div>
          <div>
            <p className="text-white/40">Monthly cap</p>
            <p className="text-white font-medium tabular-nums">{formatNumber(balance.monthlyCap)} credits</p>
          </div>
          <div>
            <p className="text-white/40">Daily average</p>
            <p className="text-white font-medium tabular-nums">{formatNumber(forecast.dailyAverageCredits)} credits</p>
          </div>
          <div>
            <p className="text-white/40">Days remaining</p>
            <p className="text-white font-medium tabular-nums">
              {forecast.daysRemaining === null ? "N/A" : forecast.daysRemaining <= 0 ? "Depleted" : `${forecast.daysRemaining} days`}
            </p>
          </div>
        </div>
      </div>

      {/* Pending reservations */}
      {reservations.length > 0 && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-6">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-white/40" />
            Pending Reservations
          </h2>
          <div className="space-y-2">
            {reservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-white/60">{r.feature_key}</span>
                <span className="text-white/40 tabular-nums">{formatNumber(r.amount)} credits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-semibold text-white">Transaction History</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="monthly_allocation">Monthly</option>
              <option value="purchase">Purchase</option>
              <option value="bonus">Bonus</option>
              <option value="capture">Used</option>
              <option value="refund">Refund</option>
            </select>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/40">
              No transactions found.
            </div>
          ) : (
            filtered.map((tx) => {
              const type = typeLabels[tx.type] ?? { label: tx.type, color: "text-white/50", icon: CheckCircle2 }
              const Icon = type.icon
              const isDebit = tx.type === "capture" || tx.type === "reservation"
              return (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-white/[0.04] ${type.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{tx.description || type.label}</p>
                    <p className="text-[10px] text-white/30">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
                    {isDebit ? "-" : "+"}{formatNumber(tx.amount)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/account/billing"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Zap className="h-4 w-4" />
          Upgrade Plan
        </Link>
      </div>
    </div>
  )
}
