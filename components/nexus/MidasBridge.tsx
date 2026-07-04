"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Link2, RefreshCw, Plus, Trash2,
  Loader2, MonitorCog, Globe, Monitor, Copy, Check, ChevronDown, ChevronUp, Terminal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { NexusConnection, ConnectionType, ConnectionStatus } from "@/lib/nexus/types"

// ─── Bridge port per IDE (must match local extension server) ─────────────────
const IDE_PORTS: Record<string, number> = {
  "VS Code":  40001,
  "Cursor":   40002,
  "Windsurf": 40003,
}

// ─── Setup commands per IDE ───────────────────────────────────────────────────
const IDE_SETUP: Record<string, { install: string; start: string; docs: string }> = {
  "VS Code": {
    install: "code --install-extension midasai.midas-bridge",
    start: "npx midas-bridge --port 40001",
    docs: "https://marketplace.visualstudio.com/items?itemName=midasai.midas-bridge",
  },
  "Cursor": {
    install: "cursor --install-extension midasai.midas-bridge",
    start: "npx midas-bridge --port 40002",
    docs: "https://docs.midasai.com/bridge/cursor",
  },
  "Windsurf": {
    install: "windsurf --install-extension midasai.midas-bridge",
    start: "npx midas-bridge --port 40003",
    docs: "https://docs.midasai.com/bridge/windsurf",
  },
}

const TYPE_ICONS: Record<ConnectionType, React.ElementType> = {
  IDE: MonitorCog,
  Browser: Globe,
  Desktop: Monitor,
}

const PRESET_CONNECTIONS: { name: string; type: ConnectionType }[] = [
  { name: "VS Code",  type: "IDE" },
  { name: "Cursor",   type: "IDE" },
  { name: "Windsurf", type: "IDE" },
  { name: "Chrome Extension", type: "Browser" },
  { name: "Desktop Bridge",   type: "Desktop" },
]

function formatLastSync(iso?: string | null) {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return new Date(iso).toLocaleTimeString()
}

// ─── Real probe: try HTTP GET to localhost:<port>/midas-bridge/ping ───────────
async function probeBridge(name: string): Promise<{ alive: boolean; version?: string }> {
  const port = IDE_PORTS[name]
  if (!port) return { alive: false }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`http://localhost:${port}/midas-bridge/ping`, {
      signal: controller.signal,
      mode: "cors",
    })
    clearTimeout(timeout)
    if (!res.ok) return { alive: false }
    const json = await res.json().catch(() => ({}))
    return { alive: true, version: json.version as string | undefined }
  } catch {
    return { alive: false }
  }
}

// ─── CopyBtn ─────────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="ml-auto flex-shrink-0 text-white/30 hover:text-white/70 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// ─── SetupPanel ───────────────────────────────────────────────────────────────
function SetupPanel({ name, onClose }: { name: string; onClose: () => void }) {
  const setup = IDE_SETUP[name]
  if (!setup) return null
  return (
    <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <p className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider">Setup required</p>
      <p className="text-xs text-white/40 leading-relaxed">
        The Midas Bridge local server was not detected on your machine.
        Run the following to start it, then click <span className="text-white/60 font-mono">Connect</span> again.
      </p>
      <div className="space-y-2">
        <p className="text-[10px] text-white/30 uppercase tracking-wider">1. Install extension</p>
        <div className="flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] text-emerald-300/80">
          <Terminal className="h-3 w-3 flex-shrink-0 text-white/20" />
          <span className="flex-1 truncate">{setup.install}</span>
          <CopyBtn text={setup.install} />
        </div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider mt-2">2. Start bridge server</p>
        <div className="flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] text-emerald-300/80">
          <Terminal className="h-3 w-3 flex-shrink-0 text-white/20" />
          <span className="flex-1 truncate">{setup.start}</span>
          <CopyBtn text={setup.start} />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <a href={setup.docs} target="_blank" rel="noreferrer"
          className="text-[11px] text-violet-400 hover:text-violet-300 underline underline-offset-2">
          View docs
        </a>
        <button onClick={onClose} className="ml-auto text-[11px] text-white/30 hover:text-white/60">Dismiss</button>
      </div>
    </div>
  )
}

// ─── ConnectionCard ───────────────────────────────────────────────────────────
function ConnectionCard({
  conn, onDelete, onStatusChange,
}: {
  conn: NexusConnection
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: ConnectionStatus, lastSync?: string) => void
}) {
  const [probing, setProbing] = useState(false)
  const [liveStatus, setLiveStatus] = useState<ConnectionStatus>(conn.status)
  const [showSetup, setShowSetup] = useState(false)
  const [bridgeVersion, setBridgeVersion] = useState<string | undefined>()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Run a real probe and update both local state and DB
  const runProbe = useCallback(async () => {
    if (conn.type !== "IDE" || !IDE_PORTS[conn.name]) {
      // Non-IDE connections: just toggle DB status
      return
    }
    setProbing(true)
    const { alive, version } = await probeBridge(conn.name)
    const newStatus: ConnectionStatus = alive ? "connected" : "disconnected"
    setLiveStatus(newStatus)
    setBridgeVersion(version)
    setShowSetup(!alive)
    onStatusChange(conn.id, newStatus, alive ? new Date().toISOString() : undefined)
    setProbing(false)
  }, [conn.id, conn.name, conn.type, onStatusChange])

  // Connect button handler
  const handleConnect = useCallback(async () => {
    setLiveStatus("pending")
    await runProbe()
  }, [runProbe])

  // Disconnect: just mark as disconnected in DB, stop polling
  const handleDisconnect = useCallback(async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setLiveStatus("disconnected")
    setShowSetup(false)
    onStatusChange(conn.id, "disconnected")
  }, [conn.id, onStatusChange])

  // Auto-poll every 10s while connected
  useEffect(() => {
    if (liveStatus === "connected" && conn.type === "IDE") {
      pollRef.current = setInterval(runProbe, 10_000)
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [liveStatus, conn.type, runProbe])

  // Probe on mount if DB says connected
  useEffect(() => {
    if (conn.status === "connected" && conn.type === "IDE") {
      runProbe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const TypeIcon = TYPE_ICONS[conn.type] ?? Link2
  const isIDE = conn.type === "IDE" && !!IDE_PORTS[conn.name]

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
          liveStatus === "connected" ? "bg-emerald-500/10" : "bg-white/[0.04]"
        )}>
          <TypeIcon className={cn("h-5 w-5", liveStatus === "connected" ? "text-emerald-400" : "text-white/40")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{conn.name}</p>
            {bridgeVersion && liveStatus === "connected" && (
              <span className="text-[9px] font-mono text-emerald-400/60 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                v{bridgeVersion}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {liveStatus === "connected" && (
              <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {liveStatus === "disconnected" && (
              <span className="block h-1.5 w-1.5 rounded-full bg-red-400/60" />
            )}
            {liveStatus === "pending" && (
              <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
            )}
            <span className={cn(
              "text-xs",
              liveStatus === "connected"    ? "text-emerald-400" :
              liveStatus === "disconnected" ? "text-red-400/70"  : "text-amber-400"
            )}>
              {liveStatus === "connected" ? "Live" :
               liveStatus === "pending"   ? "Probing..." : "Not detected"}
            </span>
            <span className="text-[10px] text-white/20">·</span>
            <span className="text-[10px] text-white/30">{conn.type}</span>
            {liveStatus === "connected" && (
              <>
                <span className="text-[10px] text-white/20">·</span>
                <span className="text-[10px] text-white/30">synced {formatLastSync(conn.last_sync)}</span>
              </>
            )}
            {isIDE && liveStatus === "disconnected" && (
              <>
                <span className="text-[10px] text-white/20">·</span>
                <span className="text-[10px] text-white/25">
                  port {IDE_PORTS[conn.name]}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveStatus === "connected" ? (
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={probing || liveStatus === "pending"}
              onClick={handleConnect}
              className={cn(liveStatus === "pending" && "opacity-70")}
            >
              {probing ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
              {liveStatus === "pending" ? "Probing…" : "Connect"}
            </Button>
          )}

          {isIDE && liveStatus === "disconnected" && (
            <button
              onClick={() => setShowSetup(s => !s)}
              className="text-white/20 hover:text-white/50 transition-colors"
              title="Setup instructions"
            >
              {showSetup ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}

          <button
            className="text-white/20 hover:text-red-400 transition-colors"
            onClick={() => { handleDisconnect(); onDelete(conn.id) }}
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showSetup && liveStatus === "disconnected" && isIDE && (
        <div className="px-4 pb-4">
          <SetupPanel name={conn.name} onClose={() => setShowSetup(false)} />
        </div>
      )}
    </div>
  )
}

// ─── MidasBridge ─────────────────────────────────────────────────────────────
export function MidasBridge() {
  const [connections, setConnections] = useState<NexusConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const fetchConnections = useCallback(async () => {
    const res = await fetch("/api/nexus/connections")
    if (res.ok) {
      const data = await res.json()
      setConnections(data.connections ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchConnections() }, [fetchConnections])

  // Update status in DB + local state
  const handleStatusChange = useCallback(async (
    id: string, status: ConnectionStatus, lastSync?: string
  ) => {
    setConnections(prev => prev.map(c =>
      c.id === id ? { ...c, status, last_sync: lastSync ?? c.last_sync } : c
    ))
    const conn = connections.find(c => c.id === id)
    if (!conn) return
    await fetch("/api/nexus/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: conn.name, type: conn.type, status }),
    }).catch(() => {})
  }, [connections])

  const addPreset = useCallback(async (preset: { name: string; type: ConnectionType }) => {
    const res = await fetch("/api/nexus/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: preset.name, type: preset.type, status: "disconnected" }),
    })
    if (res.ok) {
      const data = await res.json()
      setConnections(prev => {
        const exists = prev.find(c => c.name === data.connection.name)
        if (exists) return prev.map(c => c.name === data.connection.name ? data.connection : c)
        return [...prev, data.connection]
      })
    }
    setShowAdd(false)
  }, [])

  const deleteConnection = useCallback(async (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id))
    await fetch(`/api/nexus/connections/${id}`, { method: "DELETE" })
  }, [])

  const liveCount = connections.filter(c => c.status === "connected").length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Midas Bridge</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {liveCount > 0
              ? <span className="text-emerald-400">{liveCount} live connection{liveCount > 1 ? "s" : ""}</span>
              : "Connect your local IDE to the canvas"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchConnections}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add IDE
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
        <p className="text-[11px] text-white/30 leading-relaxed">
          <span className="text-white/50 font-medium">How it works:</span> Click{" "}
          <span className="font-mono text-white/40">Connect</span> next to your IDE.
          The bridge probes <span className="font-mono text-white/40">localhost</span> directly from your browser
          to detect a running Midas Bridge server. If not found, setup instructions appear automatically.
          Status auto-refreshes every 10 seconds.
        </p>
      </div>

      {/* Connection list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : connections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] py-16 text-center">
          <MonitorCog className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30 mb-1">No IDE connections</p>
          <p className="text-xs text-white/20 mb-5">Add VS Code, Cursor, or Windsurf to get started</p>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map(conn => (
            <ConnectionCard
              key={conn.id}
              conn={conn}
              onDelete={deleteConnection}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAdd(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] rounded-2xl border border-white/[0.08] bg-[#0e0e18] shadow-2xl p-5">
            <p className="text-sm font-semibold text-white mb-1">Add Connection</p>
            <p className="text-xs text-white/30 mb-4">Select your IDE. The bridge will probe localhost to verify it&apos;s running.</p>
            <div className="space-y-2">
              {PRESET_CONNECTIONS.map(preset => {
                const already = connections.some(c => c.name === preset.name)
                const Icon = TYPE_ICONS[preset.type]
                const port = IDE_PORTS[preset.name]
                return (
                  <button
                    key={preset.name}
                    disabled={already}
                    onClick={() => addPreset(preset)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                      already
                        ? "border-white/[0.04] opacity-40 cursor-not-allowed"
                        : "border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.03]"
                    )}
                  >
                    <Icon className="h-5 w-5 text-white/50" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{preset.name}</p>
                      <p className="text-xs text-white/30">
                        {preset.type}{port ? ` · port ${port}` : ""}
                      </p>
                    </div>
                    {already
                      ? <span className="text-xs text-white/30">Added</span>
                      : <span className="text-xs text-white/20">→</span>
                    }
                  </button>
                )
              })}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  )
}
