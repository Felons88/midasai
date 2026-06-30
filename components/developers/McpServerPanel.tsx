"use client"

import { useState } from "react"
import { Copy, Key, Server, ShieldCheck, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

type McpServerPanelProps = {
  id: string
  name: string
  description: string | null
  endpoint: string
  version: string
  status: string
  totalRequests: number
  createdAt: string
}

export function McpServerPanel({
  id,
  name,
  description,
  endpoint,
  version,
  status,
  totalRequests,
  createdAt,
}: McpServerPanelProps) {
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const active = status === "ACTIVE"

  async function copyText(label: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  async function regenerateToken() {
    setBusy(true)
    try {
      const res = await fetch(`/api/developers/mcp/${id}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      setToken(data.token)
    } catch {
      alert("Could not regenerate token")
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    if (!confirm(`Disconnect "${name}"? Existing tokens will stop working.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/developers/mcp/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      window.location.reload()
    } catch {
      alert("Could not disconnect server")
      setBusy(false)
    }
  }

  async function testConnection() {
    if (!token) {
      alert("Regenerate a token first, then test.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MCP-Token": token,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? "Request failed")
      alert(`Connected — ${data.result?.tools?.length ?? 0} tools available for your role.`)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Connection test failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${
              active ? "bg-emerald-500/10" : "bg-red-500/10"
            }`}
          >
            <Server className={`h-4 w-4 ${active ? "text-emerald-400" : "text-red-400"}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate">{name}</h3>
              <span className="text-xs text-white/40">v{version}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}
              >
                {status}
              </span>
            </div>
            {description && (
              <p className="text-sm text-white/50 mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-white/40 shrink-0">
          <p>{totalRequests.toLocaleString()} requests</p>
          <p>Since {createdAt}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.06] mb-2">
        <Server className="h-3.5 w-3.5 text-white/30 shrink-0" />
        <code className="text-xs text-white/60 truncate flex-1">{endpoint}</code>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => copyText("endpoint", endpoint)}
        >
          <Copy className="h-3.5 w-3.5" />
          {copied === "endpoint" ? "Copied" : ""}
        </Button>
      </div>

      {token && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-2">
          <Key className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <code className="text-xs text-amber-200/90 truncate flex-1">{token}</code>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-amber-400"
            onClick={() => copyText("token", token)}
          >
            <Copy className="h-3.5 w-3.5" />
            {copied === "token" ? "Copied" : ""}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={testConnection}
          className="h-8"
        >
          <Activity className="h-3.5 w-3.5 mr-1.5" />
          Test
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={regenerateToken}
          className="h-8"
        >
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
          {token ? "New token" : "Generate token"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={disconnect}
          className="h-8 text-red-400 hover:text-red-300"
        >
          Disconnect
        </Button>
      </div>
    </div>
  )
}
