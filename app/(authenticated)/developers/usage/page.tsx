import { createClient } from "@/lib/supabase/server"
import { BarChart3, TrendingUp, Activity, Clock, Zap, AlertTriangle, CheckCircle } from "lucide-react"

async function getUsageStats(userId: string) {
  try {
    const supabase = await createClient()
    
    // Mock data for now - will be replaced with real database queries
    return {
      requestsToday: 1247,
      requestsThisWeek: 8456,
      requestsThisMonth: 45678,
      avgLatency: 142,
      successRate: 99.8,
      errorRate: 0.2,
      rateLimitHits: 23,
      topEndpoints: [
        { endpoint: "/api/v1/listings", requests: 12450, avgLatency: 128 },
        { endpoint: "/api/v1/search", requests: 8934, avgLatency: 156 },
        { endpoint: "/api/v1/analytics", requests: 5678, avgLatency: 234 },
        { endpoint: "/api/v1/users", requests: 3456, avgLatency: 98 },
        { endpoint: "/api/v1/purchases", requests: 2345, avgLatency: 189 }
      ],
      recentRequests: [
        { id: 1, method: "GET", endpoint: "/api/v1/listings", status: 200, latency: 128, timestamp: "2 minutes ago" },
        { id: 2, method: "POST", endpoint: "/api/v1/search", status: 200, latency: 156, timestamp: "5 minutes ago" },
        { id: 3, method: "GET", endpoint: "/api/v1/analytics", status: 200, latency: 234, timestamp: "8 minutes ago" },
        { id: 4, method: "PUT", endpoint: "/api/v1/users", status: 401, latency: 45, timestamp: "12 minutes ago" },
        { id: 5, method: "GET", endpoint: "/api/v1/purchases", status: 429, latency: 12, timestamp: "15 minutes ago" }
      ],
      hourlyUsage: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        requests: Math.floor(Math.random() * 500) + 100
      })),
      dailyUsage: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        requests: Math.floor(Math.random() * 2000) + 500
      }))
    }
  } catch {
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
              <p className="text-xs text-yellow-400/70">You've hit the rate limit {stats.rateLimitHits} times today. Consider upgrading your plan or optimizing your requests.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
