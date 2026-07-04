"use client"

import { useState, useEffect, useCallback } from "react"
import { Key, Plus, Trash2, Eye, EyeOff, Check, X, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandIcon } from "./BrandIcon"

interface Credential {
  id: string
  provider: string
  name: string
  masked: string
  created_at: string
  updated_at: string
}

const PROVIDER_SUGGESTIONS = [
  { provider: "openai", label: "OpenAI" },
  { provider: "anthropic", label: "Anthropic" },
  { provider: "google", label: "Google AI" },
  { provider: "groq", label: "Groq" },
  { provider: "openrouter", label: "OpenRouter" },
  { provider: "mistral", label: "Mistral" },
  { provider: "cohere", label: "Cohere" },
  { provider: "github", label: "GitHub" },
  { provider: "gitlab", label: "GitLab" },
  { provider: "slack", label: "Slack" },
  { provider: "discord", label: "Discord" },
  { provider: "stripe", label: "Stripe" },
  { provider: "notion", label: "Notion" },
  { provider: "linear", label: "Linear" },
  { provider: "twilio", label: "Twilio" },
  { provider: "sendgrid", label: "SendGrid" },
  { provider: "resend", label: "Resend" },
  { provider: "supabase", label: "Supabase" },
  { provider: "vercel", label: "Vercel" },
  { provider: "aws", label: "AWS" },
  { provider: "cloudflare", label: "Cloudflare" },
  { provider: "custom", label: "Custom" },
]

export function CredentialManager() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showValue, setShowValue] = useState(false)

  const [form, setForm] = useState({ provider: "", name: "", value: "" })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/nexus/credentials")
      const data = await res.json()
      setCredentials(data.credentials ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    setFormError(null)
    if (!form.provider.trim() || !form.name.trim() || !form.value.trim()) {
      setFormError("All fields are required.")
      return
    }
    setFormSubmitting(true)
    try {
      const res = await fetch("/api/nexus/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error ?? "Failed to save."); return }
      setCredentials(prev => [...prev, data.credential])
      setForm({ provider: "", name: "", value: "" })
      setShowForm(false)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/nexus/credentials/${id}`, { method: "DELETE" })
      setCredentials(prev => prev.filter(c => c.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <Key className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">Credential Vault</h2>
          <span className="text-xs text-white/30 bg-white/[0.04] px-2 py-0.5 rounded-full">
            {credentials.length} stored
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="h-7 w-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setShowForm(v => !v); setFormError(null) }}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mx-4 mt-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
          <p className="text-xs font-medium text-white/70">Add new credential</p>

          {/* Provider selector */}
          <div className="flex flex-wrap gap-1.5">
            {PROVIDER_SUGGESTIONS.map(s => (
              <button
                key={s.provider}
                onClick={() => setForm(f => ({ ...f, provider: s.provider, name: f.name || `${s.label} Key` }))}
                className={cn(
                  "flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium border transition-all",
                  form.provider === s.provider
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20"
                )}
              >
                <BrandIcon brand={s.provider} size={10} />
                {s.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/40 block mb-1">Provider ID</label>
              <input
                value={form.provider}
                onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                placeholder="e.g. openai"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 block mb-1">Display Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. OpenAI Production"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/40 block mb-1">API Key / Secret Value</label>
            <div className="relative">
              <input
                type={showValue ? "text" : "password"}
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="sk-..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50 font-mono"
              />
              <button
                onClick={() => setShowValue(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {formError && <p className="text-xs text-red-400">{formError}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={formSubmitting}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {formSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save Credential
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ provider: "", name: "", value: "" }); setFormError(null) }}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] text-xs transition-colors"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-white/20 animate-spin" />
          </div>
        )}

        {!loading && credentials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Key className="h-10 w-10 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No credentials stored</p>
            <p className="text-xs text-white/20 mt-1">Add API keys to use in your workflows</p>
          </div>
        )}

        {credentials.map(cred => (
          <div
            key={cred.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-colors group"
          >
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <BrandIcon brand={cred.provider} size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{cred.name}</p>
              <p className="text-[10px] text-white/30 font-mono truncate">{cred.masked}</p>
            </div>
            <span className="text-[9px] text-white/20 capitalize bg-white/[0.04] px-1.5 py-0.5 rounded">
              {cred.provider}
            </span>
            <button
              onClick={() => handleDelete(cred.id)}
              disabled={deleting === cred.id}
              className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              {deleting === cred.id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Trash2 className="h-3 w-3" />
              }
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/20">
          Credentials are stored securely and only accessible to your workflows.
          They are never exposed in logs or shared with other users.
        </p>
      </div>
    </div>
  )
}
