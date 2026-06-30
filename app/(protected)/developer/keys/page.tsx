import { createClient } from "@/lib/supabase/server"
import ApiKeysClient from "./ApiKeysClient"
import { getPlanLimits } from "@/lib/subscriptions"

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMins > 0) return `${diffMins}m ago`
  return 'Just now'
}

async function getPageData(userId: string) {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    { data: apiKeys },
    { data: todayUsage },
    { data: monthUsage },
    { data: subscription },
    { data: recentLogs },
  ] = await Promise.all([
    supabase
      .from('api_keys')
      .select('id, name, key_prefix, status, permissions, rate_limit, expires_at, last_used_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('api_usage')
      .select('id, status_code, latency_ms, api_key_id')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('api_usage')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString()),
    supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single(),
    supabase
      .from('api_usage')
      .select('endpoint, method, status_code, latency_ms, created_at, api_key_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const requestsToday = todayUsage?.length || 0
  const requestsMonth = monthUsage?.length || 0
  const successToday = todayUsage?.filter(u => u.status_code >= 200 && u.status_code < 300).length || 0
  const successRate = requestsToday > 0 ? Math.round((successToday / requestsToday) * 100) : 0
  const avgLatency = requestsToday > 0 && todayUsage
    ? Math.round(todayUsage.reduce((s, u) => s + (u.latency_ms || 0), 0) / requestsToday)
    : 0

  const tier = subscription?.tier || 'FREE'
  const planLimits = getPlanLimits(tier)
  const limits = { requests: planLimits.apiRateLimit * 24 * 30, rateLimit: planLimits.apiRateLimit }

  const keys = (apiKeys || []).map(k => {
    const keyUsageToday = todayUsage?.filter(u => u.api_key_id === k.id).length || 0
    const keyUsageMonth = 0
    return {
      id: k.id,
      name: k.name,
      prefix: k.key_prefix,
      status: (k.status || 'ACTIVE').toUpperCase(),
      permissions: (k.permissions || []) as string[],
      rateLimit: k.rate_limit || 1000,
      expiresAt: k.expires_at || null,
      lastUsedAt: k.last_used_at ? formatRelativeTime(k.last_used_at) : 'Never',
      createdAt: k.created_at ? new Date(k.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      usageToday: keyUsageToday,
      usageMonth: keyUsageMonth,
      usagePercent: limits.requests > 0 ? Math.round((keyUsageMonth / limits.requests) * 100 * 10) / 10 : 0,
    }
  })

  const logs = (recentLogs || []).map(l => ({
    method: l.method,
    endpoint: l.endpoint,
    statusCode: l.status_code,
    latency: l.latency_ms,
    timestamp: l.created_at ? formatRelativeTime(l.created_at) : '',
    keyId: l.api_key_id,
  }))

  return {
    keys,
    stats: {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.status === 'ACTIVE').length,
      requestsToday,
      requestsMonth,
      successRate,
      avgLatency,
      rateLimit: limits.rateLimit,
    },
    plan: {
      tier,
      requestLimit: limits.requests,
      requestsUsed: requestsMonth,
    },
    userTier: tier,
    logs,
  }
}

export default async function ApiKeysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const data = await getPageData(user.id)

  return <ApiKeysClient data={data} />  // userTier is inside data
}
