"use client"

import { useState } from "react"
import {
  Server, Plus, Trash2, AlertTriangle,
  Key, ExternalLink, Sparkles, Globe, ArrowUpRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { McpSetupModal } from "@/components/mcp/McpSetupModal"
import { createMcpConnectionAction } from "./actions"

interface McpConnection {
  id: string
  name: string
  status: string
  createdAt: string
  lastUsed: string | null
}

interface McpClientProps {
  connections: McpConnection[]
  projectUrl: string
  plan: { tier: string; maxMcpServers: number }
}

export default function McpClient({ connections: initial, projectUrl, plan }: McpClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [revealToken, setRevealToken] = useState<{ token: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [connections, setConnections] = useState(initial)
  const router = useRouter()

  const atLimit = plan.maxMcpServers !== -1 && connections.length >= plan.maxMcpServers

  const handleCreateClick = () => {
    if (atLimit) { setShowUpgrade(true) } else { setShowCreate(true) }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError("")
    try {
      const result = await createMcpConnectionAction(newName.trim())

      if (!result.ok) {
        if (result.status === 403 && (result.code === "MCP_LIMIT" || result.error.includes("limit"))) {
          setShowCreate(false)
          setShowUpgrade(true)
          return
        }
        throw new Error(result.error || "Failed to create connection")
      }

      setShowCreate(false)
      setNewName("")
      setRevealToken({ token: result.token, name: result.server.name })
      setConnections((prev) => [
        ...prev,
        {
          id: result.server.id,
          name: result.server.name,
          status: "active",
          createdAt: new Date().toLocaleDateString(),
          lastUsed: null,
        },
      ])
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create connection")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Revoke this MCP connection? Any AI assistant using this token will lose access.")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/developers/mcp/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to revoke connection")
      }
      setConnections((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to revoke connection")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      {revealToken && (
        <McpSetupModal
          token={revealToken.token}
          connectionName={revealToken.name}
          siteUrl={projectUrl}
          onClose={() => setRevealToken(null)}
        />
      )}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0f0f16] border border-amber-500/30 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">MCP Connection limit reached</h2>
                <p className="text-xs text-white/40 mt-0.5">{connections.length} of {plan.maxMcpServers === -1 ? "∞" : plan.maxMcpServers} used on {plan.tier} plan</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-5">
              Your <span className="text-white font-medium">{plan.tier}</span> plan supports <span className="text-amber-400 font-semibold">{plan.maxMcpServers === -1 ? "unlimited" : plan.maxMcpServers} MCP connection{plan.maxMcpServers !== 1 ? "s" : ""}</span>.
              {plan.tier !== "BUSINESS" && <> Upgrade to add more.</>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowUpgrade(false)} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
              <Link href="/developer/billing" onClick={() => setShowUpgrade(false)}
                className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">MCP Connections</h1>
            <p className="text-sm text-white/50">
              Create a token in Supabase for your account, then connect Cursor, Copilot, Claude Code, or Devin.
            </p>
          </div>
          <a href="https://modelcontextprotocol.io/docs" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors">
            MCP Docs <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Key, title: "Name & create", desc: "We store an MCP server + token in your Supabase account" },
            { icon: Server, title: "Pick your tool", desc: "Get JSON or a copy-paste prompt for Cursor, Copilot, Claude, Devin, etc." },
            { icon: Sparkles, title: "Agent talks to MidasAI", desc: `Your agent calls ${projectUrl}/api/mcp with the token — not this dashboard` },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                <Icon className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{title}</p>
              <p className="text-xs text-white/40">{desc}</p>
            </div>
          ))}
        </div>

        {plan.maxMcpServers !== -1 && (
          <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <Server className="h-4 w-4 text-white/30 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/50">MCP Connections used</span>
                <span className={`text-xs font-semibold ${atLimit ? "text-red-400" : "text-white/70"}`}>
                  {connections.length} / {plan.maxMcpServers}
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${atLimit ? "bg-red-500" : connections.length / plan.maxMcpServers > 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((connections.length / plan.maxMcpServers) * 100, 100)}%` }}
                />
              </div>
            </div>
            {atLimit && (
              <Link href="/developer/billing" className="flex-shrink-0 text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                Upgrade <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}

        {showCreate ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.03] p-5 space-y-4">
            <h2 className="text-base font-semibold text-white">New MCP Connection</h2>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Connection Name *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g., My Cursor, Work Copilot"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
              />
              <p className="text-xs text-white/30 mt-1">A label for this token. After you create it, choose your AI tool and copy the setup.</p>
            </div>
            {createError && <p className="text-xs text-red-400">{createError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowCreate(false); setNewName(""); setCreateError("") }}
                className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating || !newName.trim()}
                className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                <Key className="h-4 w-4" />
                {creating ? "Creating…" : "Create connection"}
              </button>
            </div>
          </div>
        ) : (
          <div onClick={handleCreateClick}
            className={`rounded-xl border border-dashed transition-all cursor-pointer p-6 flex items-center justify-between group ${
              atLimit ? "border-red-500/20 bg-red-500/[0.01] hover:border-red-500/30" : "border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.03] hover:border-amber-500/30"
            }`}>
            <div>
              <h2 className={`text-base font-semibold transition-colors ${
                atLimit ? "text-red-400" : "text-white group-hover:text-amber-400"
              }`}>
                {atLimit ? `Limit reached — ${plan.tier} plan allows ${plan.maxMcpServers} connection${plan.maxMcpServers !== 1 ? "s" : ""}` : "New MCP Connection"}
              </h2>
              <p className="text-sm text-white/40 mt-0.5">
                {atLimit ? "Upgrade your plan to add more MCP connections." : "Name it, then copy JSON or a setup prompt for your AI tool."}
              </p>
            </div>
            <button onClick={e => { e.stopPropagation(); handleCreateClick() }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex-shrink-0">
              {atLimit ? <><ArrowUpRight className="h-4 w-4" /> Upgrade Plan</> : <><Plus className="h-4 w-4" /> New Connection</>}
            </button>
          </div>
        )}

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="p-5 border-b border-white/[0.06]">
            <h2 className="text-base font-semibold text-white">Active Connections</h2>
            <p className="text-sm text-white/40 mt-0.5">Tokens are hashed in Supabase — only shown once at creation.</p>
          </div>

          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Server className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">No MCP Connections</h3>
              <p className="text-sm text-white/40 mb-6 max-w-sm">
                Create your first connection to get tool-specific setup instructions for your AI agent.
              </p>
              <button onClick={handleCreateClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors">
                <Plus className="h-4 w-4" /> New Connection
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["CONNECTION", "ENDPOINT", "STATUS", "CREATED", "ACTIONS"].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {connections.map(conn => (
                  <tr key={conn.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        </div>
                        <p className="text-sm font-medium text-white">{conn.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-xs text-white/40 font-mono">{projectUrl}/api/mcp</code>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        conn.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${conn.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                        {conn.status === "active" ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-white/40">{conn.createdAt}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(conn.id)} disabled={deleting === conn.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] border border-transparent hover:border-red-500/20 transition-all">
                        <Trash2 className="h-3 w-3" /> Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.02]">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-1">How it works</h4>
              <p className="text-xs text-blue-400/70">
                This page creates tokens via <code className="text-blue-300/80">/api/developers/mcp</code> and Supabase.
                Your agent then calls <code className="text-blue-300/80">/api/mcp</code> with <code className="text-blue-300/80">X-MCP-Token</code> — that endpoint is only for live MCP traffic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
