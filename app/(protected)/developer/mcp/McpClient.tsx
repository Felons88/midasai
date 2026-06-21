"use client"

import { useState } from "react"
import {
  Server, Plus, Trash2, Copy, Check, AlertTriangle,
  Download, Zap, Key, Code, ExternalLink, RefreshCw,
  Terminal, Sparkles, Globe
} from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface McpConnection {
  id: string
  name: string
  token: string
  status: string
  createdAt: string
  lastUsed: string | null
}

interface McpClientProps {
  connections: McpConnection[]
  projectUrl: string
}

function RevealTokenModal({ token, name, onClose }: { token: string; name: string; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const claudeConfig = JSON.stringify({
    mcpServers: {
      midasai: {
        command: "npx",
        args: ["-y", "@midasai/mcp-server"],
        env: { MIDASAI_MCP_TOKEN: token }
      }
    }
  }, null, 2)

  const cursorConfig = `MIDASAI_MCP_TOKEN=${token}`

  const handleDownload = () => {
    const content = [
      `MidasAI MCP Connection: ${name}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      `MCP Token: ${token}`,
      "",
      "--- Claude Desktop (claude_desktop_config.json) ---",
      claudeConfig,
      "",
      "--- Cursor / .env ---",
      cursorConfig,
      "",
      "IMPORTANT: Keep this token secure. Anyone with this token can access your MidasAI account via MCP.",
    ].join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `midasai-mcp-${name.toLowerCase().replace(/\s+/g, "-")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl my-4 bg-[#0f0f16] border border-amber-500/30 rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">MCP Connection Ready</h2>
              <p className="text-xs text-amber-400/80">Save your token — it won't be shown again.</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Token */}
          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/20">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">MCP Token</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-xs text-amber-400 font-mono break-all">{token}</code>
              <button onClick={() => copy(token, "token")} className="p-1.5 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0">
                {copied === "token" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>

          {/* Claude Desktop config */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-white/40" />
                <p className="text-xs font-semibold text-white/60">Claude Desktop</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">claude_desktop_config.json</span>
              </div>
              <button onClick={() => copy(claudeConfig, "claude")} className="flex items-center gap-1 text-xs text-white/40 hover:text-amber-400 transition-colors">
                {copied === "claude" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                Copy
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/60 font-mono overflow-x-auto">{claudeConfig}</pre>
          </div>

          {/* Cursor / env */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code className="h-3.5 w-3.5 text-white/40" />
                <p className="text-xs font-semibold text-white/60">Cursor / VS Code</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">.env</span>
              </div>
              <button onClick={() => copy(cursorConfig, "cursor")} className="flex items-center gap-1 text-xs text-white/40 hover:text-amber-400 transition-colors">
                {copied === "cursor" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                Copy
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/60 font-mono">{cursorConfig}</pre>
          </div>

          <div className="flex gap-3">
            <button onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-white hover:bg-white/[0.08] transition-colors">
              <Download className="h-4 w-4" /> Download Config
            </button>
          </div>

          <button onClick={() => { onClose(); router.refresh() }}
            className="w-full h-11 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors">
            I've saved my token
          </button>
        </div>
      </div>
    </div>
  )
}

export default function McpClient({ connections: initial, projectUrl }: McpClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [revealToken, setRevealToken] = useState<{ token: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [connections, setConnections] = useState(initial)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const token = `mcp_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`

      const { data, error } = await supabase.from("mcp_servers").insert({
        user_id: user.id,
        name: newName.trim(),
        description: "MidasAI MCP connection for AI assistants",
        endpoint: projectUrl,
        version: "1.0.0",
        auth_type: "bearer",
        status: "ACTIVE",
        total_requests: 0,
        avg_latency_ms: 0,
      }).select().single()

      if (error) throw error

      await supabase.from("mcp_tokens").insert({
        user_id: user.id,
        mcp_server_id: data.id,
        token,
        status: "ACTIVE",
      })

      setShowCreate(false)
      setNewName("")
      setRevealToken({ token, name: newName.trim() })
    } catch (e: any) {
      setCreateError(e.message || "Failed to create connection")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Revoke this MCP connection? Any AI assistant using this token will lose access.")) return
    setDeleting(id)
    await supabase.from("mcp_servers").delete().eq("id", id)
    setConnections(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const copyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <>
      {revealToken && <RevealTokenModal token={revealToken.token} name={revealToken.name} onClose={() => setRevealToken(null)} />}

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">MCP Connections</h1>
            <p className="text-sm text-white/50">
              Connect AI assistants (Claude, Cursor, Windsurf) to your MidasAI account via the Model Context Protocol.
            </p>
          </div>
          <a href="https://modelcontextprotocol.io/docs" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors">
            MCP Docs <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Key, color: "amber", title: "Generate Token", desc: "Create a secure MCP token for your account" },
            { icon: Terminal, color: "blue", title: "Add to Your AI Tool", desc: "Paste the config into Claude Desktop, Cursor, or Windsurf" },
            { icon: Sparkles, color: "emerald", title: "AI Accesses MidasAI", desc: "Your AI assistant can now browse, install, and manage resources" },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className={`h-9 w-9 rounded-lg bg-${color}-500/10 flex items-center justify-center mb-3`}>
                <Icon className={`h-4 w-4 text-${color}-400`} />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{title}</p>
              <p className="text-xs text-white/40">{desc}</p>
            </div>
          ))}
        </div>

        {/* Create new connection */}
        {showCreate ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.03] p-5 space-y-4">
            <h2 className="text-base font-semibold text-white">New MCP Connection</h2>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Connection Name *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g., Claude Desktop, My Cursor Setup"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
              />
              <p className="text-xs text-white/30 mt-1">A label to identify which AI tool this token belongs to.</p>
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
                {creating ? "Generating..." : "Generate Token"}
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => setShowCreate(true)}
            className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.03] hover:border-amber-500/30 transition-all cursor-pointer p-6 flex items-center justify-between group">
            <div>
              <h2 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">New MCP Connection</h2>
              <p className="text-sm text-white/40 mt-0.5">Generate a token for Claude, Cursor, Windsurf, or any MCP-compatible tool.</p>
            </div>
            <button onClick={e => { e.stopPropagation(); setShowCreate(true) }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex-shrink-0">
              <Plus className="h-4 w-4" /> New Connection
            </button>
          </div>
        )}

        {/* Connections table */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="p-5 border-b border-white/[0.06]">
            <h2 className="text-base font-semibold text-white">Active Connections</h2>
            <p className="text-sm text-white/40 mt-0.5">Manage tokens for AI assistants connected to your account.</p>
          </div>

          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Server className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">No MCP Connections</h3>
              <p className="text-sm text-white/40 mb-6 max-w-sm">
                Generate your first MCP token to let AI assistants access your MidasAI account.
              </p>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors">
                <Plus className="h-4 w-4" /> New Connection
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["CONNECTION", "TOKEN", "STATUS", "CREATED", "ACTIONS"].map(col => (
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
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-white/40 font-mono">mcp_••••••••••••</code>
                        <button onClick={() => copyToken(conn.token, conn.id)}
                          className="p-1 rounded hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white">
                          {copiedId === conn.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
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

        {/* Info callout */}
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.02]">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-1">What can your AI assistant do?</h4>
              <p className="text-xs text-blue-400/70">With an MCP connection, Claude and Cursor can search listings, view your purchases, manage your creator profile, and interact with MidasAI resources — all without leaving your AI tool.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
