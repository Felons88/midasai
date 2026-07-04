"use client"

import { useState, useEffect, useCallback } from "react"
import { Link2, CheckCircle, XCircle, Clock, Settings, RefreshCw, Plus, Trash2, Loader2, MonitorCog, Globe, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { NexusConnection, ConnectionType, ConnectionStatus } from "@/lib/nexus/types"

const TYPE_ICONS: Record<ConnectionType, React.ElementType> = {
  IDE: MonitorCog,
  Browser: Globe,
  Desktop: Monitor,
}

const STATUS_CONFIG: Record<ConnectionStatus, { icon: React.ElementType; color: string; label: string }> = {
  connected: { icon: CheckCircle, color: "text-emerald-400", label: "Connected" },
  disconnected: { icon: XCircle, color: "text-red-400", label: "Disconnected" },
  pending: { icon: Clock, color: "text-amber-400", label: "Connecting..." },
}

const PRESET_CONNECTIONS: { name: string; type: ConnectionType }[] = [
  { name: "VS Code", type: "IDE" },
  { name: "Cursor", type: "IDE" },
  { name: "Windsurf", type: "IDE" },
  { name: "Chrome Extension", type: "Browser" },
  { name: "Desktop Bridge", type: "Desktop" },
]

function formatLastSync(iso?: string | null) {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return new Date(iso).toLocaleTimeString()
}

export function MidasBridge() {
  const [connections, setConnections] = useState<NexusConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
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

  const toggleConnection = useCallback(async (conn: NexusConnection) => {
    const newStatus: ConnectionStatus = conn.status === "connected" ? "disconnected" : "pending"
    setToggling(conn.id)
    // Optimistic update
    setConnections((prev) => prev.map((c) => c.id === conn.id ? { ...c, status: newStatus } : c))
    try {
      const res = await fetch("/api/nexus/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: conn.name, type: conn.type, status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        setConnections((prev) => prev.map((c) => c.id === conn.id || c.name === conn.name ? data.connection : c))
      }
      // Simulate pending → connected after 2s
      if (newStatus === "pending") {
        setTimeout(async () => {
          const r2 = await fetch("/api/nexus/connections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: conn.name, type: conn.type, status: "connected" }),
          })
          if (r2.ok) {
            const d2 = await r2.json()
            setConnections((prev) => prev.map((c) => c.name === conn.name ? d2.connection : c))
          }
        }, 2000)
      }
    } finally {
      setToggling(null)
    }
  }, [])

  const addPreset = useCallback(async (preset: { name: string; type: ConnectionType }) => {
    const res = await fetch("/api/nexus/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: preset.name, type: preset.type, status: "disconnected" }),
    })
    if (res.ok) {
      const data = await res.json()
      setConnections((prev) => {
        const exists = prev.find((c) => c.name === data.connection.name)
        if (exists) return prev.map((c) => c.name === data.connection.name ? data.connection : c)
        return [...prev, data.connection]
      })
    }
    setShowAdd(false)
  }, [])

  const deleteConnection = useCallback(async (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id))
    await fetch(`/api/nexus/connections/${id}`, { method: "DELETE" })
  }, [])

  const connectedCount = connections.filter((c) => c.status === "connected").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Midas Bridge</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {connectedCount} of {connections.length} connected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchConnections}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : connections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] py-16 text-center">
          <Link2 className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30 mb-4">No connections configured</p>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => {
            const TypeIcon = TYPE_ICONS[conn.type] ?? Link2
            const cfg = STATUS_CONFIG[conn.status]
            const StatusIcon = cfg.icon
            const isToggling = toggling === conn.id

            return (
              <div
                key={conn.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="h-5 w-5 text-white/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{conn.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusIcon className={cn("h-3 w-3", cfg.color, conn.status === "pending" && "animate-pulse")} />
                    <span className={cn("text-xs", cfg.color)}>{cfg.label}</span>
                    <span className="text-xs text-white/20">·</span>
                    <span className="text-xs text-white/30">{conn.type}</span>
                    <span className="text-xs text-white/20">·</span>
                    <span className="text-xs text-white/30">sync {formatLastSync(conn.last_sync)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {conn.status === "connected" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isToggling}
                      onClick={() => toggleConnection(conn)}
                    >
                      {isToggling ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isToggling || conn.status === "pending"}
                      onClick={() => toggleConnection(conn)}
                    >
                      {conn.status === "pending" ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                      ) : null}
                      {conn.status === "pending" ? "Connecting..." : "Connect"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/20 hover:text-red-400"
                    onClick={() => deleteConnection(conn.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-3.5 w-3.5 text-white/30" />
          <p className="text-xs font-medium text-white/40">Bridge Configuration</p>
        </div>
        <p className="text-xs text-white/25 leading-relaxed">
          Midas Bridge is a desktop runtime that connects your web workspace to local IDEs securely.
          Install the VS Code or Cursor extension and the desktop client to enable live file sync.
        </p>
      </div>

      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAdd(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[380px] rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl p-5">
            <p className="text-sm font-semibold text-white mb-4">Add Connection</p>
            <div className="space-y-2">
              {PRESET_CONNECTIONS.map((preset) => {
                const already = connections.some((c) => c.name === preset.name)
                const Icon = TYPE_ICONS[preset.type]
                return (
                  <button
                    key={preset.name}
                    disabled={already}
                    onClick={() => addPreset(preset)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                      already
                        ? "border-white/[0.04] opacity-40 cursor-not-allowed"
                        : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]"
                    )}
                  >
                    <Icon className="h-5 w-5 text-white/50" />
                    <div>
                      <p className="text-sm font-medium text-white">{preset.name}</p>
                      <p className="text-xs text-white/40">{preset.type}</p>
                    </div>
                    {already && <span className="ml-auto text-xs text-white/30">Added</span>}
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
