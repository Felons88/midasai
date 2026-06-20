import { createClient } from "@/lib/supabase/server"
import { Bell, Plus, Play, Pause, Trash2, CheckCircle, XCircle, Clock, Webhook } from "lucide-react"
import Link from "next/link"

async function getWebhooks(userId: string) {
  try {
    const supabase = await createClient()
    
    // Mock data for now - will be replaced with real database queries
    return [
      {
        id: "1",
        name: "Purchase Events",
        url: "https://api.example.com/webhooks/purchases",
        events: ["purchase.completed", "purchase.refunded"],
        status: "active",
        lastDelivery: "5 minutes ago",
        totalDeliveries: 1247,
        successRate: 99.2,
        createdAt: "2024-01-15",
        secret: "whsec_••••••••••••••••"
      },
      {
        id: "2",
        name: "Creator Notifications",
        url: "https://api.example.com/webhooks/creator",
        events: ["listing.created", "listing.updated", "review.created"],
        status: "active",
        lastDelivery: "2 hours ago",
        totalDeliveries: 856,
        successRate: 98.7,
        createdAt: "2024-02-01",
        secret: "whsec_••••••••••••••••"
      },
      {
        id: "3",
        name: "MCP Server Events",
        url: "https://api.example.com/webhooks/mcp",
        events: ["mcp.published", "mcp.updated"],
        status: "paused",
        lastDelivery: "3 days ago",
        totalDeliveries: 423,
        successRate: 97.8,
        createdAt: "2024-01-20",
        secret: "whsec_••••••••••••••••"
      }
    ]
  } catch {
    return []
  }
}

export default async function WebhooksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const webhooks = await getWebhooks(user.id)
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Webhooks</h1>
          <p className="text-white/50 text-sm">Configure webhooks to receive real-time events from MidasAI</p>
        </div>
        <Link
          href="/developers/webhooks/new"
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Webhook
        </Link>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <div key={webhook.id} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Webhook className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{webhook.name}</h3>
                  <p className="text-sm text-white/60 font-mono mb-2">{webhook.url}</p>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last delivery: {webhook.lastDelivery}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {webhook.successRate}% success rate
                    </span>
                    <span>{webhook.totalDeliveries.toLocaleString()} deliveries</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  webhook.status === 'active' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {webhook.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {webhook.status}
                </span>
              </div>
            </div>

            {/* Events */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Events</h4>
              <div className="flex flex-wrap gap-2">
                {webhook.events.map((event) => (
                  <span key={event} className="px-2 py-1 rounded-lg bg-white/[0.04] text-xs text-white/60">
                    {event}
                  </span>
                ))}
              </div>
            </div>

            {/* Secret */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Signing Secret</h4>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-sm font-mono text-white/60">{webhook.secret}</span>
                <button className="p-1.5 rounded hover:bg-white/[0.06] transition-colors">
                  <CheckCircle className="h-4 w-4 text-white/40" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <div className="text-xs text-white/30">
                Created: {webhook.createdAt}
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                  {webhook.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {webhook.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {webhooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Webhook className="h-12 w-12 text-white/10 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No webhooks configured</h3>
          <p className="text-sm text-white/40 mb-6">Create your first webhook to receive real-time events from MidasAI</p>
          <Link
            href="/developers/webhooks/new"
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Webhook
          </Link>
        </div>
      )}

      {/* Documentation Link */}
      <div className="mt-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
        <div className="flex items-center gap-3">
          <Webhook className="h-5 w-5 text-amber-400" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-400 mb-1">Webhook Documentation</h4>
            <p className="text-xs text-amber-400/70">Learn about webhook events, delivery, and security best practices.</p>
          </div>
          <Link
            href="/api-docs/webhooks"
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            View Docs →
          </Link>
        </div>
      </div>
    </div>
  )
}
