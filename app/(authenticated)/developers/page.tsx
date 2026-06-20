import { createClient } from "@/lib/supabase/server"
import { Key, BarChart3, Package, Bell, ShieldCheck, TrendingUp, Activity, Clock, Zap } from "lucide-react"
import Link from "next/link"

async function getDeveloperStats(userId: string) {
  try {
    const supabase = await createClient()
    
    // Mock stats for now - will be replaced with real data
    return {
      apiKeys: 3,
      requestsToday: 1247,
      requestsThisMonth: 45678,
      successRate: 99.8,
      avgLatency: 142,
      webhooks: 2,
      applications: 1,
      mcpServers: 2,
    }
  } catch {
    return {
      apiKeys: 0,
      requestsToday: 0,
      requestsThisMonth: 0,
      successRate: 0,
      avgLatency: 0,
      webhooks: 0,
      applications: 0,
      mcpServers: 0,
    }
  }
}

async function getRecentActivity(userId: string) {
  try {
    // Mock activity for now
    return [
      { id: 1, type: "api_key", message: "API key 'Production Key' created", time: "2 hours ago", icon: Key },
      { id: 2, type: "webhook", message: "Webhook 'Purchase Events' configured", time: "5 hours ago", icon: Bell },
      { id: 3, type: "request", message: "10,000 API requests milestone reached", time: "1 day ago", icon: Activity },
      { id: 4, type: "mcp", message: "MCP server 'Code Assistant' connected", time: "2 days ago", icon: ShieldCheck },
    ]
  } catch {
    return []
  }
}

export default async function DeveloperDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const stats = await getDeveloperStats(user.id)
  const recentActivity = await getRecentActivity(user.id)
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Developer Dashboard</h1>
        <p className="text-white/50 text-sm">Manage your API keys, webhooks, and developer applications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Key className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">API Keys</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.apiKeys}</p>
        </div>
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Requests Today</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.requestsToday.toLocaleString()}</p>
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/developers/keys" className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/15 transition-colors group">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Create API Key</span>
              </div>
            </Link>
            <Link href="/developers/webhooks" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">Configure Webhook</span>
              </div>
            </Link>
            <Link href="/developers/applications" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">Register Application</span>
              </div>
            </Link>
            <Link href="/api-docs" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-white/40" />
                <span className="text-sm text-white/60">View API Documentation</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/developers/usage" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center mt-0.5">
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.message}</p>
                    <p className="text-[11px] text-white/30">{activity.time}</p>
                  </div>
                </div>
              )
            })}
            {recentActivity.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-white/10 mx-auto mb-2" />
                <p className="text-sm text-white/30">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-white/40" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Webhooks</span>
          </div>
          <p className="text-xl font-bold text-white">{stats.webhooks}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-white/40" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Applications</span>
          </div>
          <p className="text-xl font-bold text-white">{stats.applications}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-white/40" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">MCP Servers</span>
          </div>
          <p className="text-xl font-bold text-white">{stats.mcpServers}</p>
        </div>
      </div>
    </div>
  )
}
