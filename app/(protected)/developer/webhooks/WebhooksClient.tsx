"use client"

import { useState } from "react"
import {
  Bell, Plus, Trash2, Search, CheckCircle, Pause, Play,
  X, ChevronRight, AlertTriangle, Globe, Clock, Zap, Activity,
  Copy, Check, Lock, ShieldCheck, ArrowUpRight
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
  plan: {
    tier: string
    maxWebhooks: number
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

// ── Upgrade prompt modal ────────────────────────────────────────────────────
function UpgradeModal({ currentCount, limit, tier, upgradeRequired, onClose }: {
  currentCount: number; limit: number; tier: string; upgradeRequired?: string; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0f0f16] border border-amber-500/30 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Webhook limit reached</h2>
            <p className="text-xs text-white/40 mt-0.5">{currentCount} of {limit === -1 ? "∞" : limit} used on {tier} plan</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-5">
          Your <span className="text-white font-medium">{tier}</span> plan supports <span className="text-amber-400 font-semibold">{limit === -1 ? "unlimited" : limit} webhook{limit !== 1 ? "s" : ""}</span>.
          {upgradeRequired && <> Upgrade to <span className="text-amber-400 font-semibold">{upgradeRequired}</span> to add more.</>}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors">
            Cancel
          </button>
          <Link href="/developer/billing" onClick={onClose}
            className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
            Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Success modal — shows secret ONCE ───────────────────────────────────────
function WebhookSuccessModal({ webhook, onClose }: {
  webhook: { id: string; name: string; url: string; events: string[]; secret: string; createdAt: string };
  onClose: () => void
}) {
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [secretRevealed, setSecretRevealed] = useState(false)

  const copyText = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0f0f16] border border-emerald-500/30 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Webhook Created Successfully</h2>
              <p className="text-xs text-white/40 mt-0.5">Save the signing secret — it will only be shown once</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          {([
            { label: "Webhook Name", value: webhook.name },
            { label: "Webhook ID", value: webhook.id ?? "—", mono: true },
            { label: "Events", value: `${webhook.events.length} event${webhook.events.length !== 1 ? "s" : ""}` },
            { label: "Created", value: new Date(webhook.createdAt).toLocaleString() },
            { label: "Status", value: "Active" },
          ] as Array<{ label: string; value: string; mono?: boolean }>).map(({ label, value, mono }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-1.5 border-b border-white/[0.04]">
              <span className="text-xs text-white/40 flex-shrink-0 w-32">{label}</span>
              <span className={`text-sm text-white text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
            </div>
          ))}

          {/* Endpoint URL */}
          <div className="py-1.5 border-b border-white/[0.04]">
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs text-white/40 flex-shrink-0 w-32">Endpoint URL</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-white font-mono text-xs break-all">{webhook.url}</span>
                <button onClick={() => copyText(webhook.url, setCopiedUrl)}
                  className="p-1 rounded text-white/30 hover:text-white transition-colors flex-shrink-0">
                  {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Signing Secret — shown ONCE */}
          <div className="mt-2 p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.04]">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Signing Secret</span>
              <span className="ml-auto text-[10px] text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded-full">Shown once only</span>
            </div>
            <div className="flex items-center gap-2">
              <code className={`flex-1 text-xs font-mono break-all transition-all ${
                secretRevealed ? "text-white" : "text-white/10 select-none blur-[6px]"
              }`}>
                {webhook.secret}
              </code>
              {!secretRevealed ? (
                <button onClick={() => setSecretRevealed(true)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs text-white/60 hover:text-white hover:bg-white/[0.1] transition-colors">
                  Reveal
                </button>
              ) : (
                <button onClick={() => copyText(webhook.secret, setCopiedSecret)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5">
                  {copiedSecret ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              )}
            </div>
            <p className="text-[11px] text-amber-400/60 mt-2">
              Store this secret in your environment variables. Once you close this modal it cannot be retrieved.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06]">
          <button onClick={onClose}
            className="w-full h-10 rounded-xl bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" />
            I have saved the secret
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create Webhook wizard ────────────────────────────────────────────────────
function CreateWebhookModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (webhook: { id: string; name: string; url: string; events: string[]; secret: string; createdAt: string }) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [events, setEvents] = useState<string[]>(["LISTING_CREATED", "PURCHASE_COMPLETED"])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const toggleEvent = (val: string) =>
    setEvents(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])

  const handleCreate = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), url: url.trim(), events }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || "Failed to create webhook")
      onCreated(data.webhook)
    } catch (e: any) {
      setError(e.message || "Failed to create webhook")
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
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <Lock className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/50">
                A cryptographically secure signing secret (<span className="text-amber-400 font-mono">whsec_...</span>) will be auto-generated and shown once after creation.
              </p>
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
              { label: "Secret", value: "Auto-generated (shown once)" },
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

export default function WebhooksClient({ webhooks: initialWebhooks, stats, plan }: WebhooksClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [successWebhook, setSuccessWebhook] = useState<{
    id: string; name: string; url: string; events: string[]; secret: string; createdAt: string
  } | null>(null)
  const [search, setSearch] = useState("")
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  const atLimit = plan.maxWebhooks !== -1 && webhooks.length >= plan.maxWebhooks

  const handleCreateClick = () => {
    if (atLimit) { setShowUpgrade(true) } else { setShowCreate(true) }
  }

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
          onCreated={(webhook) => {
            setShowCreate(false)
            setSuccessWebhook(webhook)
            router.refresh()
          }}
        />
      )}
      {successWebhook && (
        <WebhookSuccessModal
          webhook={successWebhook}
          onClose={() => setSuccessWebhook(null)}
        />
      )}
      {showUpgrade && (
        <UpgradeModal
          currentCount={webhooks.length}
          limit={plan.maxWebhooks}
          tier={plan.tier}
          upgradeRequired={plan.tier === "FREE" ? "STARTER" : plan.tier === "STARTER" ? "PRO" : "BUSINESS"}
          onClose={() => setShowUpgrade(false)}
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

        {/* Plan usage bar */}
        {plan.maxWebhooks !== -1 && (
          <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <Bell className="h-4 w-4 text-white/30 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/50">Webhooks used</span>
                <span className={`text-xs font-semibold ${atLimit ? "text-red-400" : "text-white/70"}`}>
                  {webhooks.length} / {plan.maxWebhooks}
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${atLimit ? "bg-red-500" : webhooks.length / plan.maxWebhooks > 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((webhooks.length / plan.maxWebhooks) * 100, 100)}%` }}
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

        {/* CTA Card */}
        <div
          onClick={handleCreateClick}
          className={`rounded-xl border border-dashed transition-all cursor-pointer p-6 flex items-center justify-between group ${
            atLimit
              ? "border-red-500/20 bg-red-500/[0.01] hover:border-red-500/30"
              : "border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.03] hover:border-amber-500/30"
          }`}
        >
          <div>
            <h2 className={`text-base font-semibold transition-colors ${
              atLimit ? "text-red-400" : "text-white group-hover:text-amber-400"
            }`}>
              {atLimit ? `Limit reached — ${plan.tier} plan allows ${plan.maxWebhooks} webhook${plan.maxWebhooks !== 1 ? "s" : ""}` : "Create New Webhook"}
            </h2>
            <p className="text-sm text-white/40 mt-0.5">
              {atLimit ? "Upgrade your plan to add more webhooks." : "Configure an endpoint to receive real-time event notifications."}
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleCreateClick() }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex-shrink-0 ${
              atLimit
                ? "bg-amber-500 text-black hover:bg-amber-400"
                : "bg-amber-500 text-black hover:bg-amber-400"
            }`}
          >
            {atLimit ? <><ArrowUpRight className="h-4 w-4" /> Upgrade Plan</> : <><Plus className="h-4 w-4" /> Create Webhook</>}
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
                onClick={handleCreateClick}
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
