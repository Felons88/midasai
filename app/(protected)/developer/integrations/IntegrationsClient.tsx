"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MonitorCog, Server, Link2, ShieldCheck, Trash2, Loader2,
  Clock, CheckCircle2, XCircle, Terminal, Copy, Check,
  ExternalLink, RefreshCw, Cpu, Globe, Sparkles, Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BridgeDevice {
  id: string
  ide_name: string
  ide_version?: string | null
  device_name: string
  device_os?: string | null
  device_arch?: string | null
  bridge_port: number
  last_seen_at?: string | null
  created_at: string
}

interface McpServer {
  id: string
  name: string
  description?: string | null
  endpoint: string
  version: string
  status: string
  total_requests?: number | null
  created_at: string
}

interface NexusConnection {
  id: string
  name: string
  type: string
  status: string
  last_sync?: string | null
  connection_config?: Record<string, unknown>
  created_at: string
}

interface Props {
  bridgeDevices: BridgeDevice[]
  mcpServers: McpServer[]
  nexusConnections: NexusConnection[]
  siteUrl: string
}

function formatAgo(iso?: string | null) {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="p-1 rounded hover:bg-white/[0.06] transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-white/30" />}
    </button>
  )
}

const IDE_COLORS: Record<string, string> = {
  "Windsurf":    "from-sky-500/20 to-blue-600/5 border-sky-500/20",
  "Cursor":      "from-violet-500/20 to-purple-600/5 border-violet-500/20",
  "VS Code":     "from-blue-500/20 to-blue-700/5 border-blue-500/20",
  "Claude Code": "from-amber-500/20 to-orange-600/5 border-amber-500/20",
}
const IDE_DOT: Record<string, string> = {
  "Windsurf":    "bg-sky-400",
  "Cursor":      "bg-violet-400",
  "VS Code":     "bg-blue-400",
  "Claude Code": "bg-amber-400",
}

export function IntegrationsClient({ bridgeDevices: initialDevices, mcpServers, nexusConnections, siteUrl }: Props) {
  const [devices, setDevices] = useState(initialDevices)
  const [revoking, setRevoking] = useState<string | null>(null)

  const revokeDevice = async (id: string) => {
    setRevoking(id)
    await fetch(`/api/nexus/bridge/devices?id=${id}`, { method: "DELETE" })
    setDevices(prev => prev.filter(d => d.id !== id))
    setRevoking(null)
  }

  const connectedIDEs = new Set(nexusConnections.filter(c => c.status === "connected" && c.type === "IDE").map(c => c.name))
  const activeMcp = mcpServers.filter(s => s.status === "ACTIVE").length

  return (
    <div className="p-8 space-y-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Integrations</h1>
          <p className="text-sm text-white/50">
            All your connected IDEs, MCP agents, and Nexus bridges in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {connectedIDEs.size} IDE{connectedIDEs.size !== 1 ? "s" : ""} live
          </span>
          <span className="text-white/10">·</span>
          <span>{activeMcp} MCP agent{activeMcp !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Quick connect banner */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] to-fuchsia-600/[0.03] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Connect a new IDE</p>
              <p className="text-xs text-white/40">Run this command in your IDE terminal — browser opens to approve</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-black/50 border border-white/[0.06] px-4 py-2.5 font-mono text-sm text-emerald-300/90">
            <span className="text-white/20">$</span>
            <span>npx @midasai/bridge</span>
            <CopyBtn text="npx @midasai/bridge" />
          </div>
        </div>
      </div>

      {/* ── Bridge Devices ─────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Bridge Devices</h2>
            <p className="text-xs text-white/40 mt-0.5">IDEs authorized to connect via Midas Bridge</p>
          </div>
          <Link href="/nexus?tab=bridge" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
            Manage in Nexus <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.07] py-12 text-center">
            <MonitorCog className="h-10 w-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30 mb-1">No devices connected</p>
            <p className="text-xs text-white/20">Run <code className="font-mono bg-white/[0.06] px-1 rounded">npx @midasai/bridge</code> in your IDE terminal</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {devices.map(d => {
              const colorClass = IDE_COLORS[d.ide_name] ?? "from-white/5 to-white/2 border-white/[0.07]"
              const dotClass = IDE_DOT[d.ide_name] ?? "bg-white/40"
              const isLive = connectedIDEs.has(d.ide_name)
              return (
                <div key={d.id} className={cn("rounded-2xl border bg-gradient-to-br p-4", colorClass)}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", isLive ? dotClass + " animate-pulse" : "bg-white/15")} />
                      <div>
                        <p className="text-sm font-semibold text-white">{d.ide_name}</p>
                        {d.ide_version && <p className="text-[10px] text-white/30">v{d.ide_version}</p>}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                      isLive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/[0.04] text-white/30 border-white/[0.06]"
                    )}>
                      {isLive ? "Live" : "Offline"}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{d.device_name}</span>
                      {d.device_os && <span className="text-white/20">· {d.device_os}</span>}
                    </div>
                    {d.device_arch && (
                      <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                        <Cpu className="h-3 w-3" />
                        <span>{d.device_arch}</span>
                        <span className="text-white/20">· port {d.bridge_port}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-white/25">
                      <Clock className="h-3 w-3" />
                      <span>Last seen {formatAgo(d.last_seen_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/25">
                      <ShieldCheck className="h-3 w-3 text-emerald-400/40" />
                      Authorized {formatAgo(d.created_at)}
                    </div>
                    <button
                      onClick={() => revokeDevice(d.id)}
                      disabled={revoking === d.id}
                      className="flex items-center gap-1 text-[11px] text-white/20 hover:text-red-400 transition-colors"
                    >
                      {revoking === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Revoke
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── MCP Agents ────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">MCP Agent Connections</h2>
            <p className="text-xs text-white/40 mt-0.5">
              AI agents connected via MCP protocol — auto-created when a bridge is approved
            </p>
          </div>
          <Link href="/developer/mcp" className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300">
            <Plus className="h-3 w-3" /> New connection
          </Link>
        </div>

        {mcpServers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.07] py-12 text-center">
            <Server className="h-10 w-10 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30 mb-1">No MCP agents yet</p>
            <p className="text-xs text-white/20">Connections are auto-created when you approve a bridge device</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {["AGENT", "ENDPOINT", "STATUS", "REQUESTS", "CREATED"].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold text-white/25 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mcpServers.map(server => (
                  <tr key={server.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{server.name}</p>
                          {server.description && (
                            <p className="text-[10px] text-white/30 truncate max-w-[200px]">{server.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] text-white/35 font-mono">{server.endpoint}</code>
                        <CopyBtn text={server.endpoint} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                        server.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-white/[0.04] text-white/30 border-white/[0.06]"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", server.status === "ACTIVE" ? "bg-emerald-400" : "bg-white/30")} />
                        {server.status === "ACTIVE" ? "Active" : server.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-white/40">{(server.total_requests ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-white/30">{formatAgo(server.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Nexus Connections ─────────────────────────────────────────────────── */}
      {nexusConnections.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Nexus Canvas Connections</h2>
              <p className="text-xs text-white/40 mt-0.5">IDE bridges visible in Nexus Studio</p>
            </div>
            <Link href="/nexus?tab=bridge" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              Open Nexus <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {nexusConnections.map(conn => (
              <div key={conn.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                <div className={cn(
                  "h-2 w-2 rounded-full flex-shrink-0",
                  conn.status === "connected" ? "bg-emerald-400" : "bg-white/20"
                )} />
                <Link2 className="h-4 w-4 text-white/30 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{conn.name}</p>
                  <p className="text-[10px] text-white/30">{conn.type} · Last sync: {formatAgo(conn.last_sync)}</p>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                  conn.status === "connected"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : conn.status === "pending"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-white/[0.04] text-white/25 border-white/[0.05]"
                )}>
                  {conn.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-emerald-400/40 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/25 leading-relaxed">
          Bridge connections run on <span className="font-mono text-white/35">localhost</span> — no code leaves your machine.
          MCP agents communicate only with <span className="font-mono text-white/35">{siteUrl}/api/mcp</span> using your token.
          All device tokens are stored encrypted and revocable.
        </p>
      </div>
    </div>
  )
}
