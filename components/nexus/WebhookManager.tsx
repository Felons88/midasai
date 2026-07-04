"use client"

import { useState, useEffect, useCallback } from "react"
import { Webhook, Plus, Trash2, Copy, ToggleLeft, ToggleRight, Loader2, Check, Globe, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NexusWorkflow } from "@/lib/nexus/types"

interface WebhookToken {
  id: string
  workflow_id: string
  token: string
  secret: string
  enabled: boolean
  last_used_at: string | null
  created_at: string
  nexus_workflows: { name: string } | null
}

interface WebhookManagerProps {
  workflows: NexusWorkflow[]
}

function fmt(iso: string | null) {
  if (!iso) return "Never"
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function WebhookManager({ workflows }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<WebhookToken[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const siteUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL ?? ""

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/nexus/webhooks")
      if (res.ok) {
        const data = await res.json() as { webhooks: WebhookToken[] }
        setWebhooks(data.webhooks)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch { /* ignore */ }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!selectedWorkflow) { setError("Select a workflow"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/nexus/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow_id: selectedWorkflow }),
      })
      if (!res.ok) { const d = await res.json() as { error: string }; throw new Error(d.error) }
      const data = await res.json() as { webhook: WebhookToken }
      setWebhooks(prev => [data.webhook, ...prev])
      setShowForm(false)
      setSelectedWorkflow("")
      // Auto-expand the new one to show URL
      setExpandedId(data.webhook.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create webhook")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (wh: WebhookToken) => {
    setToggling(wh.id)
    try {
      const res = await fetch(`/api/nexus/webhooks/${wh.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !wh.enabled }),
      })
      if (res.ok) {
        const data = await res.json() as { webhook: WebhookToken }
        setWebhooks(prev => prev.map(x => x.id === wh.id ? data.webhook : x))
      }
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/nexus/webhooks/${id}`, { method: "DELETE" })
      setWebhooks(prev => prev.filter(w => w.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Webhook Triggers</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
            {webhooks.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Webhook
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
          <p className="text-xs font-medium text-white/60">New Webhook Trigger</p>
          <p className="text-[10px] text-white/30">
            A unique URL will be generated. Any POST to it will trigger your workflow with the request body as input.
          </p>

          <div>
            <label className="block text-[10px] text-white/40 mb-1">Workflow <span className="text-red-400">*</span></label>
            <select
              value={selectedWorkflow}
              onChange={e => setSelectedWorkflow(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-white outline-none focus:border-cyan-500/60"
            >
              <option value="">Select workflow…</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="flex-1 h-8 rounded-lg text-xs text-white/40 hover:text-white/60 border border-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
              {saving ? "Creating…" : "Generate URL"}
            </button>
          </div>
        </form>
      )}

      {/* Webhook list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.06] py-12 text-center">
          <Webhook className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No webhooks yet</p>
          <p className="text-xs text-white/20 mt-1">Generate a URL to trigger workflows via HTTP</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map(wh => {
            const triggerUrl = `${siteUrl}/api/nexus/trigger/${wh.token}`
            const isExpanded = expandedId === wh.id
            return (
              <div
                key={wh.id}
                className={cn(
                  "rounded-xl border transition-colors",
                  wh.enabled
                    ? "border-white/[0.08] bg-white/[0.02]"
                    : "border-white/[0.04] bg-white/[0.01] opacity-60"
                )}
              >
                <div
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  onClick={() => setExpandedId(p => p === wh.id ? null : wh.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white truncate">
                        {wh.nexus_workflows?.name ?? "Unknown workflow"}
                      </span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-medium",
                        wh.enabled
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                          : "bg-white/[0.05] text-white/30 border border-white/[0.08]"
                      )}>
                        {wh.enabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/30 font-mono truncate mt-0.5">
                      /api/nexus/trigger/{wh.token.slice(0, 12)}…
                    </p>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => copyToClipboard(triggerUrl, wh.id + "-url")}
                      className="h-6 px-2 flex items-center gap-1 rounded text-[10px] text-white/30 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === wh.id + "-url" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => handleToggle(wh)}
                      disabled={toggling === wh.id}
                      className="h-6 w-6 flex items-center justify-center rounded text-white/30 hover:text-white/70 transition-colors disabled:opacity-50"
                      title={wh.enabled ? "Disable" : "Enable"}
                    >
                      {toggling === wh.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : wh.enabled
                          ? <ToggleRight className="h-3.5 w-3.5 text-emerald-400" />
                          : <ToggleLeft className="h-3.5 w-3.5" />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      disabled={deleting === wh.id}
                      className="h-6 w-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 transition-colors"
                    >
                      {deleting === wh.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/[0.05] px-3 py-3 space-y-3">
                    {/* Trigger URL */}
                    <div>
                      <p className="text-[9px] text-white/25 uppercase tracking-wide mb-1">Trigger URL (POST)</p>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.06]">
                        <code className="text-[10px] text-cyan-300 flex-1 truncate font-mono">{triggerUrl}</code>
                        <button
                          onClick={() => copyToClipboard(triggerUrl, wh.id + "-url")}
                          className="h-5 w-5 flex-shrink-0 flex items-center justify-center text-white/30 hover:text-cyan-300 transition-colors"
                        >
                          {copiedId === wh.id + "-url" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Signing secret */}
                    <div>
                      <p className="text-[9px] text-white/25 uppercase tracking-wide mb-1">Signing Secret (HMAC-SHA256)</p>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.06]">
                        <code className="text-[10px] text-yellow-300/70 flex-1 truncate font-mono">{wh.secret}</code>
                        <button
                          onClick={() => copyToClipboard(wh.secret, wh.id + "-secret")}
                          className="h-5 w-5 flex-shrink-0 flex items-center justify-center text-white/30 hover:text-yellow-300 transition-colors"
                        >
                          {copiedId === wh.id + "-secret" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <p className="text-[9px] text-white/20 mt-1">Send header: <code className="font-mono text-white/30">X-Nexus-Signature: sha256=&lt;hex&gt;</code></p>
                    </div>

                    {/* Example curl */}
                    <div>
                      <p className="text-[9px] text-white/25 uppercase tracking-wide mb-1">Example</p>
                      <pre className="text-[9px] text-white/40 font-mono bg-black/30 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST "${triggerUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"World"}'`}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 text-[9px]">
                      <div>
                        <p className="text-white/25 uppercase tracking-wide">Last Used</p>
                        <p className="text-white/40 mt-0.5">{fmt(wh.last_used_at)}</p>
                      </div>
                      <div>
                        <p className="text-white/25 uppercase tracking-wide">Created</p>
                        <p className="text-white/40 mt-0.5">{fmt(wh.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
