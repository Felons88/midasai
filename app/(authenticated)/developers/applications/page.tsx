import { createClient } from "@/lib/supabase/server"
import { Package, Plus, Globe, Github, ExternalLink, Shield, Users } from "lucide-react"
import Link from "next/link"

async function getApplications(userId: string) {
  try {
    const supabase = await createClient()
    
    // Mock data for now - will be replaced with real database queries
    return [
      {
        id: "1",
        name: "Code Assistant Pro",
        description: "AI-powered code completion and documentation tool",
        website: "https://codeassistant.com",
        callbackUrl: "https://api.codeassistant.com/auth/callback",
        logo: null,
        status: "active",
        createdAt: "2024-01-15",
        apiKeys: 2,
        webhookCount: 1,
        monthlyUsage: 45000,
        userCount: 1234
      },
      {
        id: "2",
        name: "DevTools Integration",
        description: "VS Code extension for MidasAI marketplace integration",
        website: "https://devtools.com",
        callbackUrl: "https://devtools.com/oauth/callback",
        logo: null,
        status: "active",
        createdAt: "2024-02-01",
        apiKeys: 1,
        webhookCount: 2,
        monthlyUsage: 12000,
        userCount: 567
      },
      {
        id: "3",
        name: "Analytics Dashboard",
        description: "Third-party analytics platform for marketplace insights",
        website: "https://analytics.com",
        callbackUrl: "https://analytics.com/auth/callback",
        logo: null,
        status: "suspended",
        createdAt: "2024-01-20",
        apiKeys: 3,
        webhookCount: 1,
        monthlyUsage: 89000,
        userCount: 2341
      }
    ]
  } catch {
    return []
  }
}

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const applications = await getApplications(user.id)
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Applications</h1>
          <p className="text-white/50 text-sm">Manage your OAuth applications and integrations</p>
        </div>
        <Link
          href="/developers/applications/new"
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Application
        </Link>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{app.name}</h3>
                  <p className="text-sm text-white/60 mb-2">{app.description}</p>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <a 
                      href={app.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      {app.website}
                    </a>
                    <span className="flex items-center gap-1">
                      <Github className="h-3 w-3" />
                      {app.apiKeys} API keys
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {app.userCount.toLocaleString()} users
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.status === 'active' 
                    ? 'bg-green-500/10 text-green-400' 
                    : app.status === 'suspended'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {app.status}
                </span>
              </div>
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-3 w-3 text-white/40" />
                  <span className="text-xs text-white/30">Callback URL</span>
                </div>
                <p className="text-sm text-white/60 font-mono truncate">{app.callbackUrl}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-3 w-3 text-white/40" />
                  <span className="text-xs text-white/30">API Usage</span>
                </div>
                <p className="text-sm text-white">{app.monthlyUsage.toLocaleString()} requests/month</p>
              </div>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <ExternalLink className="h-3 w-3 text-white/40" />
                  <span className="text-xs text-white/30">Created</span>
                </div>
                <p className="text-sm text-white">{app.createdAt}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span>{app.webhookCount} webhooks configured</span>
                <span>Client ID: app_{app.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/developers/applications/${app.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <Shield className="h-3 w-3" />
                  Manage
                </Link>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
                  <ExternalLink className="h-3 w-3" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="h-12 w-12 text-white/10 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No applications yet</h3>
          <p className="text-sm text-white/40 mb-6">Create your first application to start building integrations with MidasAI</p>
          <Link
            href="/developers/applications/new"
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Application
          </Link>
        </div>
      )}

      {/* Documentation Link */}
      <div className="mt-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-amber-400" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-amber-400 mb-1">OAuth Application Guide</h4>
            <p className="text-xs text-amber-400/70">Learn how to create and manage OAuth applications for third-party integrations.</p>
          </div>
          <Link
            href="/api-docs/oauth"
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            View Docs →
          </Link>
        </div>
      </div>
    </div>
  )
}
