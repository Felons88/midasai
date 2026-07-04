"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Coins, Loader2 } from "lucide-react"

interface RealtimeCreditBalanceProps {
  userId: string
  organizationId?: string | null
}

export function RealtimeCreditBalance({ userId, organizationId }: RealtimeCreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const owner = organizationId ? { organizationId } : { userId }

    // Initial balance fetch
    const fetchBalance = async () => {
      try {
        const { data } = await supabase
          .from("credit_balances")
          .select("available")
          .eq(organizationId ? "organization_id" : "user_id", organizationId || userId)
          .single()
        setBalance(data?.available ?? 0)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching balance:", error)
        setLoading(false)
      }
    }

    fetchBalance()

    // Subscribe to credit balance changes
    const channel = supabase
      .channel(`credit-balance-${owner.userId || owner.organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "credit_balances",
          filter: organizationId ? `organization_id=eq.${organizationId}` : `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            setBalance((payload.new as any).available)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, organizationId])

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-white/30" />
        <span className="text-sm text-white/40">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Coins className="h-4 w-4 text-amber-400" />
      <span className="text-sm font-semibold text-white">
        {balance?.toLocaleString() ?? 0}
      </span>
      <span className="text-xs text-white/40">credits</span>
    </div>
  )
}
