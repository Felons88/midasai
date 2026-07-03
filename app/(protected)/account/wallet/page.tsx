import { createClient } from "@/lib/supabase/server"
import { createCreditService } from "@/lib/billing/credits"
import { getUsageForecast } from "@/lib/billing/forecast"
import { WalletClient } from "./WalletClient"

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const creditService = createCreditService(supabase)
  const [balance, forecast, transactions, reservations] = await Promise.all([
    creditService.getBalance({ userId: user.id }),
    getUsageForecast(supabase, { userId: user.id }),
    supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("credit_reservations")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["reserved"])
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  return (
    <WalletClient
      balance={balance}
      forecast={forecast}
      transactions={transactions.data ?? []}
      reservations={reservations.data ?? []}
    />
  )
}
