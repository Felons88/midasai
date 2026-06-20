import { createClient } from "@/lib/supabase/server"
import { ShieldCheck, Plus, Server, Zap, Activity, Key, Copy, Check } from "lucide-react"
import Link from "next/link"

async function getMcpServers(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get real MCP servers from database
    const { data: mcpServers, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return mcpServers?.map(server => ({
      id: server.id,
      name: server.name,
      description: server.description,
      status: server.status.toLowerCase(),
      lastUsed: "Never", // Will be updated when usage tracking is implemented
      totalRequests: server.total_requests,
      avgLatency: server.avg_latency_ms,
      successRate: 100, // Will be calculated from usage tracking
      createdAt: new Date(server.created_at).toLocaleDateString(),
      token: "mcp_token_" + "•".repeat(16), // Masked token
      endpoint: server.endpoint,
      version: server.version,
      health: server.status === 'ACTIVE' ? 'healthy' : 'unhealthy'
    })) || []
  } catch (error) {
    console.error('Error fetching MCP servers:', error)
    return []
  }
}

export default async function McpServersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const mcpServers = await getMcpServers(user.id)
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">MCP Servers</h1>
          <p className="text-white/50 text-sm">Manage your Model Context Protocol servers and authentication tokens</p>
        </div>
        <Link
          href="/developers/mcp/new"
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Connect Server
        </Link>
      </div>

      {/* MCP Servers List */}
      <div className="space-y-4">
        {mcpServers.map((server) => (
          <div key={server.id} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  server.health === 'healthy' 
                    ? 'bg-green-500/10' 
                    : 'bg-red-500/10'
                }`}>
                  <Server className={`h-6 w-6 ${
                    server.health === 'healthy' 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">{server.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.06] text-white/60">
                      v{server.version}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 mb-2">{server.description}</p>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Last used: {server.lastUsed}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {server.avgLatency}ms avg latency
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {server.successRate}% success rate
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  server.status === 'active' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {server.status}
                </span>
              </div>
            </div>

            {/* Server Details */}
            <div className="space-y-3">
              {/* Endpoint */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-white/40" />
                  <span className="text-sm font-mono text-white/60">{server.endpoint}</span>
                </div>
                <button className="p-1.5 rounded hover:bg-white/[0.06] transition-colors">
                  <Copy className="h-4 w-4 text-white/40" />
                </button>
              </div>

              {/* Authentication Token */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-white/40" />
                  <span className="text-sm font-mono text-white/60">{server.token}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded hover:bg-white/[0.06] transition-colors">
                    <Copy className="h-4 w-4 text-white/40" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-white/[0.06] transition-colors">
                    <ShieldCheck className="h-4 w-4 text-white/40" />
                  </button>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-3 w-3 text-white/40" />
                    <span className="text-xs text-white/30">Total Requests</span>
                  </div>
                  <p className="text-lg font-semibold text-white">{server.totalRequests.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3 w-3 text-white/40" />
                    <span className="text-xs text-white/30">Avg Latency</span>
                  </div>
                  <p className="text-lg font-semibold text-white">{server.avgLatency}ms</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="h-3 w-3 text-white/40" />
                    <span className="text-xs text-white/30">Success Rate</span>
                  </div>
                  <p className="text-lg font-semibold text-white">{server.successRate}%</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <div className="text-xs text-white/30">
                  Connected: {server.createdAt}
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                    <Activity className="h-3 w-3" />
                    Test Connection
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                    <ShieldCheck className="h-3 w-3" />
                    Regenerate Token
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors">
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mcpServers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Server className="h-12 w-12 text-white/10 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No MCP servers connected</h3>
          <p className="text-sm text-white/40 mb-6">Connect your first MCP server to start using Model Context Protocol</p>
          <Link
            href="/developers/mcp/new"
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Connect Server
          </Link>
        </div>
      )}

      {/* Documentation Link */}
      <div className="mt-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-400 mb-1">MCP Server Integration Guide</h4>
            <p className="text-xs text-amber-400/70">Learn how to connect and configure MCP servers with MidasAI.</p>
          </div>
          <Link
            href="/api-docs/mcp"
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            View Docs →
          </Link>
        </div>
      </div>
    </div>
  )
}
