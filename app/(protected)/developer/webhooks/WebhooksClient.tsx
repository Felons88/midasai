"use client"

import { useState } from "react"
import {
  Bell, Plus, Trash2, Search, CheckCircle, Pause, Play,
  X, ChevronRight, AlertTriangle, Globe, Clock, Zap, Activity
} from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  status: string
  lastDelivery: string
  totalDeliveries: number
  successRate: number
  createdAt: string
}

interface WebhooksClientProps {
  webhooks: Webhook[]
  stats: {
    total: number
    active: number
    totalDeliveries: number
    successRate: number
  }
}

// Only events relevant to a creator's own content and payments
const ALL_EVENTS: { value: string; label: string; desc: string }[] = [
  { value: "LISTING_CREATED",   label: "Listing Created",    desc: "When you publish a new listing" },
  { value: "LISTING_UPDATED",   label: "Listing Updated",    desc: "When you update a listing" },
  { value: "LISTING_DELETED",   label: "Listing Deleted",    desc: "When you delete a listing" },
  { value: "PURCHASE_COMPLETED",label: "Purchase Completed", desc: "When someone buys your content" },
  { value: "PURCHASE_REFUNDED", label: "Purchase Refunded",  desc: "When a purchase on your content is refunded" },
  { value: "REVIEW_CREATED",    label: "Review Received",    desc: "When someone reviews your listing" },
  { value: "CREATOR_FOLLOWED",  label: "New Follower",       desc: "When someone follows your profile" },
]

const STEP_LABELS = ["Endpoint", "Events", "Review"]

function CreateWebhookModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [events, setEvents] = useState<string[]>(["LISTING_CREATED", "PURCHASE_COMPLETED"])
  const [secret, setSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  const toggleEvent = (val: string) =>
    setEvents(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  const handleCreate = async () => {
    setLoading(true)
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const webhookSecret = secret.trim() || `whsec_${crypto.randomUUID().replace(/-/g, "").substring(0, 32)}`

      // Use RPC or raw query to properly cast the enum array
      const { error: err } = await supabase.rpc("create_webhook", {
        p_user_id: user.id,
        p_name: name.trim(),
        p_url: url.trim(),
        p_events: events,
        p_secret: webhookSecret,
      })

      if (err) {
        // Fallback: direct insert without enum typing
        const { error: insertErr } = await supabase.from("webhooks").insert({
          user_id: user.id,
          name: name.trim(),
          url: url.trim(),
          events: events,
          secret: webhookSecret,
          status: "ACTIVE",
          total_deliveries: 0,
          failed_deliveries: 0,
        })
        if (insertErr) throw insertErr
      }

      onCreated()
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Failed to create webhook")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0f0f16] border border-white/[0.08] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-white">Create Webhook</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold border ${
                    step === i + 1 ? "bg-amber-500 border-amber-500 text-black"
                    : step > i + 1 ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-white/[0.04] border-white/[0.1] text-white/40"
                  }`}>{i + 1}</span>
                  <span className={`text-xs ${step === i + 1 ? "text-white" : "text-white/30"}`}>{label}</span>
                  {i < 2 && <ChevronRight className="h-3 w-3 text-white/20" />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Endpoint */}
        {step === 1 && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Webhook Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Production Webhook"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Endpoint URL *</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://your-domain.com/webhook"
                type="url"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
              />
              <p className="text-xs text-white/30 mt-1">HTTPS endpoint that will receive POST requests</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Signing Secret <span className="normal-case font-normal text-white/30">(optional — auto-generated if blank)</span></label>
              <input
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="whsec_..."
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm font-mono"
              />
            </div>
          </div>
        )}

        {/* Step 2: Events */}
        {step === 2 && (
          <div className="p-5 space-y-3">
            <p className="text-sm text-white/50">Select which events should trigger this webhook.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {ALL_EVENTS.map(ev => (
                <button
                  key={ev.value}
                  onClick={() => toggleEvent(ev.value)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    events.includes(ev.value)
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-white/[0.02] border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                    events.includes(ev.value) ? "bg-amber-500 border-amber-500" : "border-white/30"
                  }`}>
                    {events.includes(ev.value) && <span className="text-[9px] font-bold text-black">✓</span>}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${events.includes(ev.value) ? "text-amber-400" : "text-white/70"}`}>{ev.label}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{ev.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30">{events.length} event{events.length !== 1 ? "s" : ""} selected</p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="p-5 space-y-3">
            <p className="text-sm text-white/50 mb-4">Review your webhook configuration before creating.</p>
            {[
              { label: "Name", value: name },
              { label: "Endpoint", value: url },
              { label: "Events", value: `${events.length} selected` },
              { label: "Secret", value: secret || "Auto-generated" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.04]">
                <span className="text-xs text-white/40 flex-shrink-0 w-24">{label}</span>
                <span className="text-sm text-white text-right break-all">{value}</span>
              </div>
            ))}
            <div className="pt-2">
              <p className="text-xs text-white/30 mb-2">Events:</p>
              <div className="flex flex-wrap gap-1.5">
                {events.map(e => {
                  const ev = ALL_EVENTS.find(x => x.value === e)
                  return <span key={e} className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">{ev?.label ?? e}</span>
                })}
              </div>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
              className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors">
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
              disabled={step === 1 && (!name.trim() || !url.trim())}
              className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading || events.length === 0}
              className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {loading ? "Creating..." : "Create Webhook"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WebhooksClient({ webhooks: initialWebhooks, stats }: WebhooksClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState("")
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  const filtered = webhooks.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.url.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggle = async (id: string, currentStatus: string) => {
    setToggling(id)
    const newStatus = currentStatus === "active" ? "INACTIVE" : "ACTIVE"
    await supabase.from("webhooks").update({ status: newStatus }).eq("id", id)
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, status: newStatus.toLowerCase() } : w))
    setToggling(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook? All delivery history will be lost.")) return
    setDeleting(id)
    await supabase.from("webhooks").delete().eq("id", id)
    setWebhooks(prev => prev.filter(w => w.id !== id))
    setDeleting(null)
  }

  return (
    <>
      {showCreate && (
        <CreateWebhookModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); router.refresh() }}
        />
      )}

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Webhooks</h1>
            <p className="text-sm text-white/50">
              Receive real-time event notifications via HTTP POST to your endpoints.
            </p>
          </div>
          <Link href="/api-docs/webhooks" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors">
            View Docs
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-xs text-white/40">Total Webhooks</span>
            </div>
            <p className="text-3xl font-bold text-white mb-0.5">{stats.total}</p>
            <p className="text-xs text-white/40">{stats.active} active</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-xs text-white/40">Active</span>
            </div>
            <p className="text-3xl font-bold text-white mb-0.5">{stats.active}</p>
            <p className="text-xs text-white/40">delivering events</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-xs text-white/40">Total Deliveries</span>
            </div>
            <p className="text-3xl font-bold text-white mb-0.5">{stats.totalDeliveries.toLocaleString()}</p>
            <p className="text-xs text-white/40">all time</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-xs text-white/40">Success Rate</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 mb-0.5">{stats.successRate}%</p>
            <p className="text-xs text-white/40">delivery success</p>
          </div>
        </div>

        {/* CTA Card */}
        <div
          onClick={() => setShowCreate(true)}
          className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.03] hover:border-amber-500/30 transition-all cursor-pointer p-6 flex items-center justify-between group"
        >
          <div>
            <h2 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">Create New Webhook</h2>
            <p className="text-sm text-white/40 mt-0.5">Configure an endpoint to receive real-time event notifications.</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setShowCreate(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Webhook
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-semibold text-white">Your Webhooks</h2>
              <p className="text-sm text-white/40 mt-0.5">Manage and monitor your webhook endpoints.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search webhooks..."
                className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/30 w-48"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">No Webhooks Yet</h3>
              <p className="text-sm text-white/40 mb-6 max-w-sm">
                Create your first webhook to start receiving real-time event notifications.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Webhook
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["WEBHOOK", "EVENTS", "DELIVERIES", "SUCCESS", "LAST DELIVERY", "STATUS", "ACTIONS"].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(webhook => (
                  <tr key={webhook.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{webhook.name}</p>
                      <p className="text-xs text-white/40 font-mono truncate max-w-[180px]">{webhook.url}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-white/60">{webhook.events.length} event{webhook.events.length !== 1 ? "s" : ""}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-white">{webhook.totalDeliveries.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${webhook.successRate >= 95 ? "text-emerald-400" : webhook.successRate >= 80 ? "text-amber-400" : "text-red-400"}`}>
                        {webhook.successRate}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{webhook.lastDelivery}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        webhook.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${webhook.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                        {webhook.status === "active" ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(webhook.id, webhook.status)}
                          disabled={toggling === webhook.id}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                          title={webhook.status === "active" ? "Pause" : "Resume"}
                        >
                          {webhook.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(webhook.id)}
                          disabled={deleting === webhook.id}
                          className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Docs callout */}
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-400 mb-1">Webhook Security</h4>
              <p className="text-xs text-amber-400/70">Always verify webhook signatures using the signing secret to ensure requests are from MidasAI.</p>
            </div>
            <Link href="/api-docs/webhooks" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">View Docs →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
