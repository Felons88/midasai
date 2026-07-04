import { createClient } from "@/lib/supabase/server"
import { getBillingContext } from "@/lib/billing/entitlements"
import BillingClient from "./BillingClient"

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const billing = await getBillingContext(supabase, user.id)

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, current_period_start, cancel_at_period_end, stripe_subscription_id")
    .eq("user_id", user.id)
    .in("status", ["ACTIVE", "TRIALING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <BillingClient
      context={billing}
      subscription={subscription}
      userId={user.id}
    />
  )
}
