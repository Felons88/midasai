import { createClient } from "@/lib/supabase/server"
import { 
  Key, 
  BarChart3, 
  Package, 
  Bell, 
  ShieldCheck, 
  TrendingUp, 
  Activity, 
  Clock, 
  Zap,
  Code,
  Globe,
  FileText,
  Settings,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Users,
  Server,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

async function getDeveloperStats(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get real stats from database
    const [
      { count: apiKeys },
      { count: webhooks },
      { count: applications },
      { count: mcpServers },
      { data: todayUsage }
    ] = await Promise.all([
      supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ACTIVE'),
      supabase.from('webhooks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ACTIVE'),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ACTIVE'),
      supabase.from('mcp_servers').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ACTIVE'),
      supabase
        .from('api_usage')
        .select('status_code, latency_ms')
        .eq('user_id', userId)
        .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
    ])

    // Calculate real metrics from today's usage
    const requestsToday = todayUsage?.length || 0
    const successCount = todayUsage?.filter(u => u.status_code >= 200 && u.status_code < 300).length || 0
    const successRate = requestsToday > 0 ? (successCount / requestsToday) * 100 : 0
    const avgLatency = requestsToday > 0 
      ? Math.round(todayUsage.reduce((sum, u) => sum + u.latency_ms, 0) / requestsToday)
      : 0

    // Get monthly usage
    const { count: requestsThisMonth } = await supabase
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(new Date().setDate(1)).toISOString())

    return {
      apiKeys: apiKeys || 0,
      requestsToday,
      requestsThisMonth: requestsThisMonth || 0,
      successRate: Math.round(successRate * 10) / 10,
      avgLatency,
      webhooks: webhooks || 0,
      applications: applications || 0,
      mcpServers: mcpServers || 0,
    }
  } catch (error) {
    console.error('Error fetching developer stats:', error)
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
    const supabase = await createClient()
    
    // Get real recent activity from audit logs and recent items
    const [
      { data: recentApiKeys },
      { data: recentWebhooks },
      { data: recentMcpServers },
      { data: recentUsage }
    ] = await Promise.all([
      supabase
        .from('api_keys')
        .select('name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('webhooks')
        .select('name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('mcp_servers')
        .select('name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2),
      supabase
        .from('api_usage')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
    ])

    const activity = []
    
    // Add recent API key creations
    recentApiKeys?.forEach(key => {
      activity.push({
        id: `api_key_${key.created_at}`,
        type: "api_key",
        message: `API key '${key.name}' created`,
        time: formatRelativeTime(key.created_at),
        icon: Key
      })
    })
    
    // Add recent webhook creations
    recentWebhooks?.forEach(webhook => {
      activity.push({
        id: `webhook_${webhook.created_at}`,
        type: "webhook",
        message: `Webhook '${webhook.name}' configured`,
        time: formatRelativeTime(webhook.created_at),
        icon: Bell
      })
    })
    
    // Add recent MCP server creations
    recentMcpServers?.forEach(server => {
      activity.push({
        id: `mcp_${server.created_at}`,
        type: "mcp",
        message: `MCP server '${server.name}' connected`,
        time: formatRelativeTime(server.created_at),
        icon: ShieldCheck
      })
    })
    
    // Add recent API usage milestone
    if (recentUsage && recentUsage.length > 0) {
      const { count: totalUsage } = await supabase
        .from('api_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      
      if (totalUsage && totalUsage > 0 && totalUsage % 1000 === 0) {
        activity.push({
          id: `usage_${recentUsage[0].created_at}`,
          type: "request",
          message: `${totalUsage.toLocaleString()} API requests milestone reached`,
          time: formatRelativeTime(recentUsage[0].created_at),
          icon: Activity
        })
      }
    }

    // Sort by most recent and limit to 4 items
    return activity
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 4)
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
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
    return 'Just now'
  }
}

export default async function DeveloperDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const stats = await getDeveloperStats(user.id)
  const recentActivity = await getRecentActivity(user.id)
  
  const appCards = [
    { title: 'API Keys', desc: 'Create and manage production API keys', icon: Key, href: '/developers/keys', count: stats.apiKeys },
    { title: 'Webhooks', desc: 'Configure real-time event notifications', icon: Bell, href: '/developers/webhooks', count: stats.webhooks },
    { title: 'Applications', desc: 'Register OAuth applications and manage access', icon: Package, href: '/developers/applications', count: stats.applications },
    { title: 'Usage Analytics', desc: 'Monitor API performance and usage patterns', icon: BarChart3, href: '/developers/usage', count: stats.requestsToday },
    { title: 'MCP Servers', desc: 'Connect and manage Model Context Protocol servers', icon: ShieldCheck, href: '/developers/mcp', count: stats.mcpServers },
    { title: 'API Playground', desc: 'Test API endpoints with interactive tools', icon: Code, href: '/developers/playground', count: null },
    { title: 'Documentation', desc: 'Comprehensive API documentation and guides', icon: FileText, href: '/api-docs', count: null },
    { title: 'Logs', desc: 'View detailed API logs and error tracking', icon: Activity, href: '/developers/logs', count: null },
    { title: 'Settings', desc: 'Configure developer preferences and defaults', icon: Settings, href: '/developers/settings', count: null }
  ]

  return (
    <div className="min-h-screen bg-[#07070b]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Developer Portal</h1>
              <p className="text-lg text-white/60 max-w-2xl">Build powerful integrations with the MidasAI platform</p>
            </div>
            <Link href="/developers/keys/new" className="flex items-center gap-2 h-11 px-6 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all text-sm font-semibold shadow-lg shadow-amber-500/25">
              <Plus className="h-4 w-4" /> Create API Key
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Stats Overview */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-amber-500/10 to-amber-600/5 hover:from-amber-500/15 hover:to-amber-600/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Key className="h-6 w-6 text-amber-400" />
              </div>
              <TrendingUp className="h-4 w-4 text-amber-400/60" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.apiKeys}</p>
            <p className="text-sm text-white/50">API Keys</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:from-blue-500/15 hover:to-blue-600/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <Zap className="h-4 w-4 text-blue-400/60" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.requestsToday.toLocaleString()}</p>
            <p className="text-sm text-white/50">Requests Today</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-green-500/10 to-green-600/5 hover:from-green-500/15 hover:to-green-600/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <CheckCircle className="h-4 w-4 text-green-400/60" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.successRate}%</p>
            <p className="text-sm text-white/50">Success Rate</p>
          </div>
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:from-purple-500/15 hover:to-purple-600/10 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
              <Activity className="h-4 w-4 text-purple-400/60" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.avgLatency}ms</p>
            <p className="text-sm text-white/50">Avg Latency</p>
          </div>
        </div>

        {/* App Launcher Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Developer Tools</h2>
            <p className="text-sm text-white/50">Click any tool to get started</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appCards.map((app) => (
              <Link
                key={app.title}
                href={app.href}
                className="group relative p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.02] to-white/[0.01] hover:from-white/[0.04] hover:to-white/[0.02] hover:border-white/[0.15] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <app.icon className="h-7 w-7 text-amber-400" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/95 transition-colors">
                  {app.title}
                </h3>
                <p className="text-sm text-white/60 mb-4 line-clamp-2">
                  {app.desc}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/50">
                    {app.count !== null ? `${app.count} active` : 'Coming soon'}
                  </span>
                  {app.count !== null && app.count > 0 && (
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

      {/* Recent Activity */}
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <Link
              href="/developers/logs"
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              View all logs
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <activity.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.message}</p>
                    <p className="text-xs text-white/40">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 mb-2">No recent activity</p>
                <p className="text-sm text-white/20">Start building to see your activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
