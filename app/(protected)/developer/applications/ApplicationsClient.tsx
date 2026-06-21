"use client"

import { useState } from "react"
import {
  Package, Plus, Trash2, Search, Globe, Users, Shield,
  X, ChevronRight, AlertTriangle, Copy, Check, Download,
  ExternalLink
} from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Application {
  id: string
  name: string
  description: string
  website: string
  callbackUrl: string
  status: string
  createdAt: string
  clientId: string
}

interface ApplicationsClientProps {
  applications: Application[]
  stats: {
    total: number
    active: number
  }
}

const STEP_LABELS = ["Details", "OAuth Config", "Review"]

function CreateAppModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (creds: { clientId: string; clientSecret: string; name: string }) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [website, setWebsite] = useState("")
  const [callbackUrl, setCallbackUrl] = useState("")
  const [additionalCallbacks, setAdditionalCallbacks] = useState<string[]>([])
  const [callbackInput, setCallbackInput] = useState("")
  const [scopes, setScopes] = useState<string[]>(["read:profile"])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createBrowserSupabaseClient()

  const ALL_SCOPES = [
    "read:profile", "read:listings", "write:listings",
    "read:analytics", "read:transactions", "write:reviews",
  ]

  const toggleScope = (s: string) =>
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const addCallback = () => {
    const val = callbackInput.trim()
    if (val && !additionalCallbacks.includes(val)) setAdditionalCallbacks(prev => [...prev, val])
    setCallbackInput("")
  }

  const handleCreate = async () => {
    setLoading(true)
    setError("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const clientId = `app_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`
      const clientSecret = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")

      const { error: err } = await supabase.from("applications").insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim(),
        website: website.trim(),
        callback_url: callbackUrl.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        status: "ACTIVE",
      })
      if (err) throw err

      onCreated({ clientId, clientSecret, name: name.trim() })
    } catch (e: any) {
      setError(e.message || "Failed to create application")
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
            <h2 className="text-base font-semibold text-white">Create Application</h2>
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

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Application Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., My Integration" autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what your application does" rows={2}
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Website URL *</label>
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://your-app.com" type="url"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm" />
            </div>
          </div>
        )}

        {/* Step 2: OAuth Config */}
        {step === 2 && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Primary Callback URL *</label>
              <input value={callbackUrl} onChange={e => setCallbackUrl(e.target.value)} placeholder="https://your-app.com/auth/callback" type="url"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm" />
              <p className="text-xs text-white/30 mt-1">Users are redirected here after authorization</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Additional Callbacks <span className="normal-case font-normal text-white/30">(optional)</span></label>
              <div className="flex gap-2 mb-2">
                <input value={callbackInput} onChange={e => setCallbackInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addCallback()} placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-500/50" />
                <button onClick={addCallback} className="px-3 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {additionalCallbacks.map(cb => (
                  <span key={cb} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.06] text-xs text-white/70">
                    {cb}
                    <button onClick={() => setAdditionalCallbacks(p => p.filter(x => x !== cb))} className="text-white/30 hover:text-red-400"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">OAuth Scopes</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_SCOPES.map(scope => (
                  <button key={scope} onClick={() => toggleScope(scope)}
                    className={`px-3 py-2 rounded-lg border text-left text-xs font-mono transition-all ${
                      scopes.includes(scope) ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-white/[0.02] border-white/[0.08] text-white/50 hover:border-white/20"
                    }`}>{scope}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="p-5 space-y-3">
            <p className="text-sm text-white/50 mb-4">Review your application before creating. Client credentials will be shown once.</p>
            {[
              { label: "Name", value: name },
              { label: "Website", value: website },
              { label: "Callback", value: callbackUrl },
              { label: "Scopes", value: scopes.join(", ") },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.04]">
                <span className="text-xs text-white/40 flex-shrink-0 w-24">{label}</span>
                <span className="text-sm text-white text-right break-all">{value}</span>
              </div>
            ))}
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
              disabled={step === 1 ? !name.trim() || !website.trim() : !callbackUrl.trim()}
              className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={loading}
              className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              {loading ? "Creating..." : "Create Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RevealCredsModal({ creds, onClose }: {
  creds: { clientId: string; clientSecret: string; name: string }
  onClose: () => void
}) {
  const [copiedId, setCopiedId] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const router = useRouter()

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const handleDownload = () => {
    const content = [
      `MidasAI OAuth Application: ${creds.name}`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `Client ID: ${creds.clientId}`,
      `Client Secret: ${creds.clientSecret}`,
      ``,
      `IMPORTANT: Keep the client secret secure. Do not commit it to version control.`,
    ].join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `midasai-app-${creds.name.toLowerCase().replace(/\s+/g, "-")}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#0f0f16] border border-amber-500/30 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Application Created</h2>
            <p className="text-sm text-amber-400/80">Save your credentials — the client secret won't be shown again.</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Client ID</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm text-white font-mono">{creds.clientId}</code>
              <button onClick={() => copy(creds.clientId, setCopiedId)} className="p-1.5 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0">
                {copiedId ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/20">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Client Secret</p>
            <div className="flex items-center justify-between gap-3">
              <code className="text-sm text-amber-400 font-mono break-all">{creds.clientSecret}</code>
              <button onClick={() => copy(creds.clientSecret, setCopiedSecret)} className="p-1.5 rounded hover:bg-white/[0.06] transition-colors flex-shrink-0">
                {copiedSecret ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/40" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-white hover:bg-white/[0.08] transition-colors">
            <Download className="h-4 w-4" /> Download .txt
          </button>
        </div>

        <button onClick={() => { onClose(); router.refresh() }}
          className="w-full h-11 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors">
          I've saved my credentials
        </button>
      </div>
    </div>
  )
}

export default function ApplicationsClient({ applications: initial, stats }: ApplicationsClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [revealCreds, setRevealCreds] = useState<{ clientId: string; clientSecret: string; name: string } | null>(null)
  const [search, setSearch] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [apps, setApps] = useState(initial)
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.website.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this application? This will revoke all OAuth tokens.")) return
    setDeleting(id)
    await supabase.from("applications").delete().eq("id", id)
    setApps(prev => prev.filter(a => a.id !== id))
    setDeleting(null)
  }

  return (
    <>
      {showCreate && (
        <CreateAppModal
          onClose={() => setShowCreate(false)}
          onCreated={creds => { setShowCreate(false); setRevealCreds(creds) }}
        />
      )}
      {revealCreds && <RevealCredsModal creds={revealCreds} onClose={() => setRevealCreds(null)} />}

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Applications</h1>
            <p className="text-sm text-white/50">Register OAuth applications to integrate third-party services with MidasAI.</p>
          </div>
          <Link href="/api-docs/oauth" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors">
            OAuth Docs <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Apps", value: stats.total, sub: `${stats.active} active`, color: "blue", Icon: Package },
            { label: "Active", value: stats.active, sub: "running now", color: "emerald", Icon: Shield },
            { label: "OAuth Clients", value: stats.total, sub: "registered", color: "amber", Icon: Users },
            { label: "Integrations", value: stats.active, sub: "connected", color: "purple", Icon: Globe },
          ].map(({ label, value, sub, color, Icon }) => (
            <div key={label} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-9 w-9 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 text-${color}-400`} />
                </div>
                <span className="text-xs text-white/40">{label}</span>
              </div>
              <p className="text-3xl font-bold text-white mb-0.5">{value}</p>
              <p className="text-xs text-white/40">{sub}</p>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <div onClick={() => setShowCreate(true)}
          className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.03] hover:border-amber-500/30 transition-all cursor-pointer p-6 flex items-center justify-between group">
          <div>
            <h2 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">Register New Application</h2>
            <p className="text-sm text-white/40 mt-0.5">Create an OAuth app to integrate your services with MidasAI.</p>
          </div>
          <button onClick={e => { e.stopPropagation(); setShowCreate(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex-shrink-0">
            <Plus className="h-4 w-4" /> Create Application
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-semibold text-white">Your Applications</h2>
              <p className="text-sm text-white/40 mt-0.5">Manage your registered OAuth applications.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..."
                className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/30 w-48" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">No Applications Yet</h3>
              <p className="text-sm text-white/40 mb-6 max-w-sm">Register your first OAuth application to start building integrations.</p>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors">
                <Plus className="h-4 w-4" /> Create Application
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["APPLICATION", "WEBSITE", "CALLBACK URL", "STATUS", "CREATED", "ACTIONS"].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <tr key={app.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{app.name}</p>
                      <p className="text-xs text-white/40 truncate max-w-[160px]">{app.description || "No description"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <a href={app.website} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-white/50 hover:text-amber-400 transition-colors font-mono truncate block max-w-[140px]">
                        {app.website}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-white/50 font-mono truncate block max-w-[160px]">{app.callbackUrl}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        app.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${app.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                        {app.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-white/40">{app.createdAt}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(app.id)} disabled={deleting === app.id}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
