import { createClient } from "@/lib/supabase/server"
import { Key, Plus, Eye, EyeOff, Copy, Check, Trash2, Shield, Zap } from "lucide-react"
import Link from "next/link"

async function getApiKeys(userId: string) {
  try {
    const supabase = await createClient()
    
    // Mock data for now - will be replaced with real database queries
    return [
      {
        id: "1",
        name: "Production API Key",
        prefix: "midas_prod_",
        permissions: ["read", "write", "analytics"],
        environment: "production",
        lastUsed: "2 hours ago",
        createdAt: "2024-01-15",
        expiresAt: "2025-01-15",
        rateLimit: 10000,
        status: "active"
      },
      {
        id: "2", 
        name: "Development API Key",
        prefix: "midas_dev_",
        permissions: ["read", "write"],
        environment: "development",
        lastUsed: "1 day ago",
        createdAt: "2024-02-01",
        expiresAt: "2024-08-01",
        rateLimit: 1000,
        status: "active"
      },
      {
        id: "3",
        name: "Testing API Key",
        prefix: "midas_test_",
        permissions: ["read"],
        environment: "sandbox",
        lastUsed: "3 days ago", 
        createdAt: "2024-01-20",
        expiresAt: "2024-04-20",
        rateLimit: 500,
        status: "expired"
      }
    ]
  } catch {
    return []
  }
}

export default async function ApiKeysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const apiKeys = await getApiKeys(user.id)
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">API Keys</h1>
          <p className="text-white/50 text-sm">Manage your API keys for accessing MidasAI services</p>
        </div>
        <Link
          href="/developers/keys/new"
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create API Key
        </Link>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <div key={apiKey.id} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Key className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{apiKey.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {apiKey.environment}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {apiKey.rateLimit.toLocaleString()} req/hour
                    </span>
                    <span>Last used: {apiKey.lastUsed}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  apiKey.status === 'active' 
                    ? 'bg-green-500/10 text-green-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {apiKey.status}
                </span>
              </div>
            </div>

            {/* Key Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-white/40" />
                  <span className="text-sm font-mono text-white/60">{apiKey.prefix}••••••••••••••••</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded hover:bg-white/[0.06] transition-colors">
                    <Eye className="h-4 w-4 text-white/40" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-white/[0.06] transition-colors">
                    <Copy className="h-4 w-4 text-white/40" />
                  </button>
                </div>
              </div>

              {/* Permissions */}
              <div className="flex flex-wrap gap-2">
                {apiKey.permissions.map((permission) => (
                  <span key={permission} className="px-2 py-1 rounded-lg bg-white/[0.04] text-xs text-white/60">
                    {permission}
                  </span>
                ))}
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-white/30">
                <span>Created: {apiKey.createdAt}</span>
                <span>Expires: {apiKey.expiresAt}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                  <Eye className="h-3 w-3" />
                  Reveal Key
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                  <Trash2 className="h-3 w-3" />
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {apiKeys.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Key className="h-12 w-12 text-white/10 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No API keys yet</h3>
          <p className="text-sm text-white/40 mb-6">Create your first API key to start using the MidasAI API</p>
          <Link
            href="/developers/keys/new"
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </Link>
        </div>
      )}

      {/* Documentation Link */}
      <div className="mt-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-amber-400" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-400 mb-1">Getting Started with API Keys</h4>
            <p className="text-xs text-amber-400/70">Learn how to create, manage, and secure your API keys in our documentation.</p>
          </div>
          <Link
            href="/api-docs/authentication"
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            View Docs →
          </Link>
        </div>
      </div>
    </div>
  )
}
