import type { SupabaseClient } from "@supabase/supabase-js"

export type CreatorTransaction = {
  amount: number
  fee: number | null
  net_amount: number
  status: string | null
  created_at: string | null
  listing_id: string | null
}

export type CreatorRevenueSummary = {
  grossRevenue: number
  platformFees: number
  netRevenue: number
  refunds: number
  completedCount: number
}

export function summarizeTransactions(
  transactions: CreatorTransaction[]
): CreatorRevenueSummary {
  const completed = transactions.filter((t) => t.status === "COMPLETED")
  const refunded = transactions.filter((t) => t.status === "REFUNDED")

  const grossRevenue = completed.reduce((sum, t) => sum + t.amount, 0)
  const platformFees = completed.reduce((sum, t) => sum + (t.fee ?? 0), 0)
  const refunds = refunded.reduce((sum, t) => sum + t.amount, 0)
  const netFromRows = completed.reduce((sum, t) => sum + (t.net_amount ?? t.amount - (t.fee ?? 0)), 0)

  return {
    grossRevenue,
    platformFees,
    netRevenue: netFromRows - refunds,
    refunds,
    completedCount: completed.length,
  }
}

export async function fetchCreatorTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<CreatorTransaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, fee, net_amount, status, created_at, listing_id")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching creator transactions:", error)
    return []
  }

  return data ?? []
}

export async function fetchCreatorPayouts(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching payouts:", error)
    return []
  }

  return data ?? []
}
