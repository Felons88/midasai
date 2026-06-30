import { createClient } from "@/lib/supabase/server"
import { getStripeSetupStatus } from "@/lib/stripe/config"
import BillingClient from "./BillingClient"

async function getPageData(userId: string) {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    { data: subscription },
    { data: billingEvents },
    { data: usageMonth },
    { data: assets },
    { data: apiKeys },
    { data: webhooks },
    { data: mcpServers },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("tier, status, current_period_end, current_period_start, cancel_at_period_end, stripe_subscription_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("billing_events")
      .select("event_type, amount, currency, created_at, stripe_event_id, metadata")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("api_usage")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("assets")
      .select("file_size")
      .eq("user_id", userId),
    supabase
      .from("api_keys")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "ACTIVE"),
    supabase
      .from("webhooks")
      .select("id")
      .eq("user_id", userId),
    supabase
      .from("mcp_servers")
      .select("id")
      .eq("user_id", userId),
  ])

  const totalStorageBytes = assets?.reduce((s, a) => s + (a.file_size || 0), 0) || 0
  const storageGbUsed = Math.round((totalStorageBytes / (1024 * 1024 * 1024)) * 100) / 100

  return {
    subscription: subscription || null,
    billingEvents: billingEvents || [],
    usage: {
      apiRequestsMonth: usageMonth?.length || 0,
      storageGbUsed,
      activeApiKeys: apiKeys?.length || 0,
      webhooks: webhooks?.length || 0,
      mcpServers: mcpServers?.length || 0,
    },
  }
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const data = await getPageData(user.id)
  const stripeSetup = getStripeSetupStatus()
  return <BillingClient data={data} stripeSetup={stripeSetup} />
}
