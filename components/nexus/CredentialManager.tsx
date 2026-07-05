"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Key, Plus, Trash2, Eye, EyeOff, Check, X, Loader2, RefreshCw, 
  Shield, ShieldCheck, ShieldAlert, Copy, Star, StarOff, Play, 
  ExternalLink, Clock, AlertCircle 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandIcon } from "./BrandIcon"
import type { ProviderType, ConnectionStatus, CredentialField } from "@/lib/credentials/provider-types"

interface Credential {
  id: string
  provider: ProviderType
  name: string
  description?: string | null
  masked: string
  is_default: boolean
  connection_status: ConnectionStatus
  last_tested_at: string | null
  last_successful_at: string | null
  connection_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface ProviderConfig {
  id: ProviderType
  name: string
  icon: string
  category: string
  fields: CredentialField[]
  documentationUrl?: string
  rateLimitInfo?: string
}

const PROVIDER_CATEGORIES = {
  ai: { label: "AI", providers: ["openai", "anthropic", "google-ai", "groq", "openrouter", "mistral", "cohere"] },
  dev: { label: "Development", providers: ["github", "gitlab", "linear"] },
  communication: { label: "Communication", providers: ["slack", "discord", "twilio", "sendgrid", "resend"] },
  infrastructure: { label: "Infrastructure", providers: ["stripe", "notion", "supabase", "vercel", "aws", "cloudflare"] },
}

const PROVIDER_NAMES: Record<ProviderType, string> = {
  "openai": "OpenAI",
  "anthropic": "Anthropic",
  "google-ai": "Google AI",
  "groq": "Groq",
  "openrouter": "OpenRouter",
  "mistral": "Mistral",
  "cohere": "Cohere",
  "github": "GitHub",
  "gitlab": "GitLab",
  "slack": "Slack",
  "discord": "Discord",
  "stripe": "Stripe",
  "notion": "Notion",
  "linear": "Linear",
  "twilio": "Twilio",
  "sendgrid": "SendGrid",
  "resend": "Resend",
  "supabase": "Supabase",
  "vercel": "Vercel",
  "aws": "AWS",
  "cloudflare": "Cloudflare",
}

export function CredentialManager() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null)
  const [formFields, setFormFields] = useState<Record<string, string>>({})
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [showFieldValues, setShowFieldValues] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [credsRes, providersRes] = await Promise.all([
        fetch("/api/nexus/credentials"),
        fetch("/api/nexus/providers")
      ])
      const credsData = await credsRes.json()
      const providersData = await providersRes.json()
      setCredentials(credsData.credentials ?? [])
      setProviders(providersData.providers ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleProviderSelect = (providerId: ProviderType) => {
    setSelectedProvider(providerId)
    const provider = providers.find(p => p.id === providerId)
    if (provider) {
      const initialFields: Record<string, string> = {}
      provider.fields.forEach(field => {
        initialFields[field.key] = ""
      })
      setFormFields(initialFields)
      setFormName(`${PROVIDER_NAMES[providerId]} Credential`)
      setFormErrors({})
      setShowFieldValues({})
    }
  }

  const handleFieldChange = (key: string, value: string) => {
    setFormFields(prev => ({ ...prev, [key]: value }))
    setFormErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[key]
      return newErrors
    })
  }

  const handleAdd = async () => {
    if (!selectedProvider) return

    setFormErrors({})
    const errors: Record<string, string> = {}

    if (!formName.trim()) {
      errors.name = "Name is required"
    }

    const provider = providers.find(p => p.id === selectedProvider)
    if (provider) {
      provider.fields.forEach(field => {
        if (field.required && !formFields[field.key]?.trim()) {
          errors[field.key] = `${field.label} is required`
        }
      })
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormSubmitting(true)
    try {
      const res = await fetch("/api/nexus/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          name: formName,
          description: formDescription,
          fields: formFields,
          isDefault: false
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormErrors({ general: data.error ?? "Failed to save credential" })
        return
      }
      setCredentials(prev => [...prev, data.credential])
      setShowForm(false)
      setSelectedProvider(null)
      setFormFields({})
      setFormName("")
      setFormDescription("")
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

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const res = await fetch(`/api/nexus/credentials/${id}/test`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setCredentials(prev => prev.map(c => 
          c.id === id 
            ? { 
                ...c, 
                connection_status: data.result.status,
                last_tested_at: data.result.timestamp,
                last_successful_at: data.result.success ? data.result.timestamp : c.last_successful_at,
                connection_metadata: data.result.metadata || {}
              }
            : c
        ))
      }
    } finally {
      setTesting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    setSettingDefault(id)
    try {
      await fetch(`/api/nexus/credentials/${id}/default`, { method: "POST" })
      setCredentials(prev => prev.map(c => ({
        ...c,
        is_default: c.id === id ? true : c.provider === prev.find(x => x.id === id)?.provider ? false : c.is_default
      })))
    } finally {
      setSettingDefault(null)
    }
  }

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
      case "failed":
      case "invalid":
      case "expired":
        return <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
      case "unknown":
        return <Shield className="h-3.5 w-3.5 text-white/30" />
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
    }
  }

  const formatAgo = (iso: string | null) => {
    if (!iso) return "Never"
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
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
            onClick={() => { setShowForm(v => !v); setFormErrors({}) }}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mx-4 mt-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-4">
          <p className="text-xs font-medium text-white/70">Add new credential</p>

          {!selectedProvider ? (
            <div className="space-y-3">
              {Object.entries(PROVIDER_CATEGORIES).map(([category, { label, providers }]) => (
                <div key={category}>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {providers.map(providerId => (
                      <button
                        key={providerId}
                        onClick={() => handleProviderSelect(providerId as ProviderType)}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[10px] font-medium border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
                      >
                        <BrandIcon brand={providerId} size={12} />
                        {PROVIDER_NAMES[providerId as ProviderType]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1"
                >
                  ← Back to providers
                </button>
                <div className="flex items-center gap-2">
                  <BrandIcon brand={selectedProvider!} size={16} />
                  <span className="text-xs font-medium text-white">{PROVIDER_NAMES[selectedProvider!]}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/40 block mb-1">Name</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. OpenAI Production"
                  className={cn(
                    "w-full bg-white/[0.04] border rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none transition-colors",
                    formErrors.name ? "border-red-500/50 focus:border-red-500" : "border-white/[0.08] focus:border-violet-500/50"
                  )}
                />
                {formErrors.name && <p className="text-[10px] text-red-400 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="text-[10px] text-white/40 block mb-1">Description (optional)</label>
                <input
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="e.g. Production API key for main app"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-violet-500/50"
                />
              </div>

              {providers.find(p => p.id === selectedProvider)?.fields.map(field => (
                <div key={field.key}>
                  <label className="text-[10px] text-white/40 block mb-1">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={field.sensitive && !showFieldValues[field.key] ? "password" : field.type}
                      value={formFields[field.key] || ""}
                      onChange={e => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={cn(
                        "w-full bg-white/[0.04] border rounded-lg px-2.5 py-1.5 pr-8 text-xs text-white placeholder-white/20 outline-none transition-colors",
                        field.sensitive ? "font-mono" : "",
                        formErrors[field.key] ? "border-red-500/50 focus:border-red-500" : "border-white/[0.08] focus:border-violet-500/50"
                      )}
                    />
                    {field.sensitive && (
                      <button
                        onClick={() => setShowFieldValues(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showFieldValues[field.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                  {formErrors[field.key] && <p className="text-[10px] text-red-400 mt-1">{formErrors[field.key]}</p>}
                </div>
              ))}

              {formErrors.general && <p className="text-xs text-red-400">{formErrors.general}</p>}

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
                  onClick={() => { setShowForm(false); setSelectedProvider(null); setFormErrors({}) }}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] text-xs transition-colors"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          )}
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
            className="flex items-start gap-3 px-3 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-colors group"
          >
            <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <BrandIcon brand={cred.provider} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-white truncate">{cred.name}</p>
                {cred.is_default && (
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                )}
              </div>
              {cred.description && (
                <p className="text-[10px] text-white/30 truncate mt-0.5">{cred.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] text-white/20 capitalize bg-white/[0.04] px-1.5 py-0.5 rounded">
                  {PROVIDER_NAMES[cred.provider]}
                </span>
                <div className="flex items-center gap-1 text-[9px] text-white/30">
                  {getStatusIcon(cred.connection_status)}
                  <span className="capitalize">{cred.connection_status}</span>
                </div>
                {cred.last_tested_at && (
                  <div className="flex items-center gap-1 text-[9px] text-white/30">
                    <Clock className="h-2.5 w-2.5" />
                    <span>Tested {formatAgo(cred.last_tested_at)}</span>
                  </div>
                )}
              </div>
              {cred.connection_metadata && Object.keys(cred.connection_metadata).length > 0 && (
                <div className="mt-1.5 text-[9px] text-white/20">
                  {cred.connection_metadata.user && <span>Connected as {cred.connection_metadata.user}</span>}
                  {cred.connection_metadata.workspace && <span> · {cred.connection_metadata.workspace}</span>}
                  {cred.connection_metadata.organization && <span> · {cred.connection_metadata.organization}</span>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleTest(cred.id)}
                disabled={testing === cred.id}
                className="h-6 w-6 flex items-center justify-center rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                title="Test connection"
              >
                {testing === cred.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              </button>
              <button
                onClick={() => handleSetDefault(cred.id)}
                disabled={settingDefault === cred.id || cred.is_default}
                className="h-6 w-6 flex items-center justify-center rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                title={cred.is_default ? "Default credential" : "Set as default"}
              >
                {settingDefault === cred.id ? <Loader2 className="h-3 w-3 animate-spin" /> : cred.is_default ? <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> : <StarOff className="h-3 w-3" />}
              </button>
              <button
                onClick={() => handleDelete(cred.id)}
                disabled={deleting === cred.id}
                className="h-6 w-6 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Delete"
              >
                {deleting === cred.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/20">
          Credentials are encrypted at rest and only accessible to your workflows.
          They are never exposed in logs or shared with other users.
        </p>
      </div>
    </div>
  )
}
