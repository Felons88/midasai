import { createClient } from "@/lib/supabase/server"
import { getPlanLimits } from "@/lib/subscriptions"
import DashboardClient from "./DashboardClient"

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: userData },
    { count: totalDownloads },
    { count: downloadsLast30 },
    { count: bookmarks },
    { count: totalListings },
    { data: transactions },
    { data: txLast30 },
    { data: sub },
    { data: recentActivity },
    { data: marketplaceListings },
    { data: notifications },
    { count: apiKeyCount },
    { count: webhookCount },
    { count: mcpCount },
    { count: apiLogCount },
  ] = await Promise.all([
    supabase.from('users').select('name, role, avatar_url').eq('id', userId).single(),
    supabase.from('downloads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('downloads').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', thirtyDaysAgo),
    supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('creator_id', userId),
    supabase.from('transactions').select('amount').eq('creator_id', userId).eq('status', 'COMPLETED'),
    supabase.from('transactions').select('amount').eq('creator_id', userId).eq('status', 'COMPLETED').gte('created_at', thirtyDaysAgo),
    supabase.from('subscriptions').select('tier, status, current_period_start, current_period_end, stripe_price_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('activity_feed').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(10),
    supabase.from('listings').select('id, title, price, downloads, average_rating, rating_count, category, created_at').order('downloads', { ascending: false }).limit(6),
    supabase.from('notifications').select('id, title, message, type, priority, read_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
    supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ACTIVE'),
    supabase.from('webhooks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('mcp_servers').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ACTIVE'),
    supabase.from('api_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', thirtyDaysAgo),
  ])

  const revenue = transactions?.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0
  const revenueLast30 = txLast30?.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0
  const tier = (sub?.tier || 'FREE') as string
  const planLimits = getPlanLimits(tier)
  const unreadCount = notifications?.filter((n: any) => !n.read_at).length || 0

  return {
    userName: (userData as any)?.name || '',
    userRole: (userData as any)?.role || 'USER',
    tier,
    planName: tier.charAt(0) + tier.slice(1).toLowerCase(),
    planLimits,
    billing: {
      periodEnd: sub?.current_period_end || null,
      periodStart: sub?.current_period_start || null,
      status: sub?.status || 'FREE',
    },
    stats: {
      downloads: totalDownloads || 0,
      downloadsLast30: downloadsLast30 || 0,
      bookmarks: bookmarks || 0,
      listings: totalListings || 0,
      revenue,
      revenueLast30,
      views: apiLogCount || 0,
      followers: 0,
      conversion: totalListings && totalDownloads ? Math.round(((totalDownloads || 0) / Math.max(totalListings || 1, 1)) * 10) / 10 : 0,
    },
    usage: {
      apiRequests: apiLogCount || 0,
      apiRequestLimit: planLimits.apiRateLimit * 720,
      storageUsed: 0,
      storageLimit: planLimits.storageGb,
      apiKeys: apiKeyCount || 0,
      apiKeyLimit: planLimits.maxApplications,
      webhooks: webhookCount || 0,
      webhookLimit: planLimits.maxWebhooks,
      mcpServers: mcpCount || 0,
      mcpLimit: planLimits.maxMcpServers,
    },
    recentActivity: recentActivity || [],
    marketplaceListings: marketplaceListings || [],
    notifications: notifications || [],
    unreadCount,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const data = await getDashboardData(user.id)
  return <DashboardClient data={data} />
}
