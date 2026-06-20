"use client"

import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Server, ArrowLeft, Copy, Check, AlertTriangle, Activity } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewMcpServerPage() {
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [version, setVersion] = useState("1.0.0")
  const [authType, setAuthType] = useState("bearer")
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const handleConnectServer = async () => {
    if (!name.trim() || !endpoint.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Generate MCP token
      const mcpToken = `mcp_${Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64').substring(0, 32)}`

      // Create MCP server record
      const { data: server, error: serverError } = await supabase.from('mcp_servers').insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim(),
        endpoint: endpoint.trim(),
        version: version,
        auth_type: authType,
        status: 'ACTIVE',
        total_requests: 0,
        avg_latency_ms: 0,
      }).select().single()

      if (serverError) throw serverError

      // Create MCP token record
      const { error: tokenError } = await supabase.from('mcp_tokens').insert({
        user_id: user.id,
        mcp_server_id: server.id,
        token: mcpToken,
        status: 'ACTIVE',
      })

      if (tokenError) throw tokenError

      setToken(mcpToken)
    } catch (error) {
      console.error('Error connecting MCP server:', error)
      alert('Failed to connect MCP server')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleContinue = () => {
    router.push('/developer/mcp')
  }

  const handleTestConnection = async () => {
    // This would call the endpoint to test connectivity
    alert('Connection test would be implemented here')
  }

  if (token) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/developer/mcp" className="flex items-center gap-2 text-white/60 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to MCP Servers
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">MCP Server Connected</h1>
          <p className="text-white/60">Save your authentication token now. You won&apos;t be able to see it again.</p>
        </div>

        <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-400">
              Save this MCP token securely. For security reasons, we won&apos;t show it to you again.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-black/50 border border-white/[0.1] mb-4">
            <div className="flex items-center justify-between">
              <code className="text-sm text-amber-400 font-mono break-all">{token}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="ml-2 flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-amber-500 text-black hover:bg-amber-400"
          >
            I&apos;ve saved my token
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/developer/mcp" className="flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to MCP Servers
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Connect MCP Server</h1>
        <p className="text-white/60">Register a new Model Context Protocol server</p>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Server Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My MCP Server"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this MCP server provides"
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        {/* Endpoint */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Server Endpoint</label>
          <input
            type="url"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://your-mcp-server.com"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
          <p className="text-xs text-white/40 mt-1">The URL where your MCP server is hosted</p>
        </div>

        {/* Version */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Version</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Auth Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Authentication Type</label>
          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="bearer">Bearer Token</option>
            <option value="api_key">API Key</option>
            <option value="oauth2">OAuth 2.0</option>
            <option value="none">No Authentication</option>
          </select>
        </div>

        {/* Test Connection Button */}
        <Button
          onClick={handleTestConnection}
          variant="outline"
          className="w-full border-white/[0.1] text-white hover:bg-white/[0.04]"
          disabled={!endpoint.trim()}
        >
          <Activity className="h-4 w-4 mr-2" />
          Test Connection
        </Button>

        {/* Connect Button */}
        <Button
          onClick={handleConnectServer}
          disabled={loading || !name.trim() || !endpoint.trim()}
          className="w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect Server'}
        </Button>
      </div>
    </div>
  )
}
