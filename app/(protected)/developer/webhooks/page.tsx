import { createClient } from "@/lib/supabase/server"
import { getPlanLimits } from "@/lib/subscriptions"
import WebhooksClient from "./WebhooksClient"

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  return diffMinutes > 0 ? `${diffMinutes}m ago` : "Just now"
}

async function getPageData(userId: string) {
  const supabase = await createClient()

  const [{ data: rows }, { data: sub }] = await Promise.all([
    supabase.from("webhooks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("tier").eq("user_id", userId).eq("status", "ACTIVE").maybeSingle(),
  ])

  const tier = sub?.tier ?? "FREE"
  const limits = getPlanLimits(tier)

  const webhooks = (rows || []).map(w => ({
    id: w.id,
    name: w.name,
    url: w.url,
    events: w.events || [],
    status: (w.status || "ACTIVE").toLowerCase(),
    lastDelivery: w.last_delivery_at ? formatRelativeTime(w.last_delivery_at) : "Never",
    totalDeliveries: w.total_deliveries || 0,
    successRate: (w.total_deliveries || 0) > 0
      ? Math.round(((w.total_deliveries - (w.failed_deliveries || 0)) / w.total_deliveries) * 1000) / 10
      : 100,
    createdAt: new Date(w.created_at).toLocaleDateString(),
  }))

  const active = webhooks.filter(w => w.status === "active").length
  const totalDeliveries = webhooks.reduce((s, w) => s + w.totalDeliveries, 0)
  const successRate = webhooks.length > 0
    ? Math.round(webhooks.reduce((s, w) => s + w.successRate, 0) / webhooks.length * 10) / 10
    : 100

  return {
    webhooks,
    stats: { total: webhooks.length, active, totalDeliveries, successRate },
    plan: { tier, maxWebhooks: limits.maxWebhooks },
  }
}

export default async function WebhooksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { webhooks, stats, plan } = await getPageData(user.id)
  return <WebhooksClient webhooks={webhooks} stats={stats} plan={plan} />
}
