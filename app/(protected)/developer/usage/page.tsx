import { createClient } from "@/lib/supabase/server"
import { BarChart3, TrendingUp, Activity, Clock, Zap, AlertTriangle, CheckCircle } from "lucide-react"

async function getUsageStats(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get real usage stats from database
    const now = new Date()
    const todayStart = new Date(now.setHours(0, 0, 0, 0))
    const weekStart = new Date(now.setDate(now.getDate() - 7))
    const monthStart = new Date(now.setDate(1))
    
    // Get usage data for different time periods
    const [
      { data: todayUsage },
      { data: weekUsage },
      { data: monthUsage },
      { data: recentRequests },
      { data: topEndpoints }
    ] = await Promise.all([
      supabase
        .from('api_usage')
        .select('status_code, latency_ms')
        .eq('user_id', userId)
        .gte('created_at', todayStart.toISOString()),
      supabase
        .from('api_usage')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString()),
      supabase
        .from('api_usage')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString()),
      supabase
        .from('api_usage')
        .select('method, endpoint, status_code, latency_ms, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('api_usage')
        .select('endpoint, latency_ms')
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString())
    ])

    // Calculate real metrics
    const requestsToday = todayUsage?.length || 0
    const requestsThisWeek = weekUsage?.length || 0
    const requestsThisMonth = monthUsage?.length || 0
    
    const successCount = todayUsage?.filter(u => u.status_code >= 200 && u.status_code < 300).length || 0
    const successRate = requestsToday > 0 ? (successCount / requestsToday) * 100 : 0
    const avgLatency = requestsToday > 0 && todayUsage
      ? Math.round(todayUsage.reduce((sum, u) => sum + (u.latency_ms || 0), 0) / requestsToday)
      : 0
    
    // Calculate top endpoints
    const endpointStats = new Map()
    topEndpoints?.forEach(req => {
      const current = endpointStats.get(req.endpoint) || { count: 0, totalLatency: 0 }
      endpointStats.set(req.endpoint, {
        count: current.count + 1,
        totalLatency: current.totalLatency + req.latency_ms
      })
    })
    
    const topEndpointsList = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.count,
        avgLatency: Math.round(stats.totalLatency / stats.count)
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5)

    // Format recent requests
    const formattedRecentRequests = recentRequests?.map(req => ({
      id: req.created_at,
      method: req.method,
      endpoint: req.endpoint,
      status: req.status_code,
      latency: req.latency_ms,
      timestamp: formatRelativeTime(req.created_at)
    })) || []

    // Get hourly usage for last 24 hours
    const hourlyUsage = await getHourlyUsage(userId)
    
    // Get daily usage for last 30 days
    const dailyUsage = await getDailyUsage(userId)

    return {
      requestsToday,
      requestsThisWeek,
      requestsThisMonth,
      avgLatency,
      successRate: Math.round(successRate * 10) / 10,
      errorRate: Math.round((100 - successRate) * 10) / 10,
      rateLimitHits: 0, // Will be implemented with rate limiting
      topEndpoints: topEndpointsList,
      recentRequests: formattedRecentRequests,
      hourlyUsage,
      dailyUsage
    }
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return {
      requestsToday: 0,
      requestsThisWeek: 0,
      requestsThisMonth: 0,
      avgLatency: 0,
      successRate: 0,
      errorRate: 0,
      rateLimitHits: 0,
      topEndpoints: [],
      recentRequests: [],
      hourlyUsage: [],
      dailyUsage: []
    }
  }
}

async function getHourlyUsage(userId: string) {
  const supabase = await createClient()
  const hourlyUsage = []
  
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date()
    hourStart.setHours(hourStart.getHours() - i, 0, 0, 0)
    const hourEnd = new Date(hourStart)
    hourEnd.setHours(hourEnd.getHours() + 1)
    
    const { count } = await supabase
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', hourStart.toISOString())
      .lt('created_at', hourEnd.toISOString())
    
    hourlyUsage.push({
      hour: 23 - i,
      requests: count || 0
    })
  }
  
  return hourlyUsage
}

async function getDailyUsage(userId: string) {
  const supabase = await createClient()
  const dailyUsage = []
  
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date()
    dayStart.setDate(dayStart.getDate() - i)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    
    const { count } = await supabase
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', dayStart.toISOString())
      .lt('created_at', dayEnd.toISOString())
    
    dailyUsage.push({
      day: 30 - i,
      requests: count || 0
    })
  }
  
  return dailyUsage
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return diffMinutes > 0 ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : 'Just now'
  }
}

export default async function UsageAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const stats = await getUsageStats(user.id)
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Usage Analytics</h1>
        <p className="text-white/50 text-sm">Monitor your API usage, performance, and rate limits</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Requests Today</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.requestsToday.toLocaleString()}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">This Month</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.requestsThisMonth.toLocaleString()}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Success Rate</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">{stats.successRate}%</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Avg Latency</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgLatency}ms</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Hourly Usage */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Hourly Usage (Last 24 Hours)</h2>
          <div className="h-48 flex items-end gap-1">
            {stats.hourlyUsage.map((hour, index) => (
              <div
                key={index}
                className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 transition-colors rounded-t"
                style={{ height: `${(hour.requests / 600) * 100}%` }}
                title={`${hour.requests} requests at ${hour.hour}:00`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Daily Usage */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Daily Usage (Last 30 Days)</h2>
          <div className="h-48 flex items-end gap-1">
            {stats.dailyUsage.map((day, index) => (
              <div
                key={index}
                className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 transition-colors rounded-t"
                style={{ height: `${(day.requests / 2500) * 100}%` }}
                title={`${day.requests} requests on day ${day.day}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/30">
            <span>Day 1</span>
            <span>Day 15</span>
            <span>Day 30</span>
          </div>
        </div>
      </div>

      {/* Top Endpoints */}
      <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Top Endpoints</h2>
        <div className="space-y-3">
          {stats.topEndpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white/60">{endpoint.endpoint}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white">{endpoint.requests.toLocaleString()} requests</span>
                <span className="text-white/50">{endpoint.avgLatency}ms avg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Requests</h2>
        <div className="space-y-2">
          {stats.recentRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  request.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                  request.method === 'POST' ? 'bg-green-500/10 text-green-400' :
                  request.method === 'PUT' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {request.method}
                </span>
                <span className="text-sm font-mono text-white/60">{request.endpoint}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className={`flex items-center gap-1 ${
                  request.status === 200 ? 'text-green-400' :
                  request.status === 401 ? 'text-yellow-400' :
                  request.status === 429 ? 'text-red-400' :
                  'text-red-400'
                }`}>
                  {request.status === 200 ? <CheckCircle className="h-3 w-3" /> :
                   request.status === 429 ? <AlertTriangle className="h-3 w-3" /> :
                   <AlertTriangle className="h-3 w-3" />}
                  {request.status}
                </span>
                <span className="text-white/50">{request.latency}ms</span>
                <span className="text-white/30">{request.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limit Warning */}
      {stats.rateLimitHits > 0 && (
        <div className="mt-6 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.02]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-400 mb-1">Rate Limit Activity</h4>
              <p className="text-xs text-yellow-400/70">You have hit the rate limit {stats.rateLimitHits} times today. Consider upgrading your plan or optimizing your requests.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
