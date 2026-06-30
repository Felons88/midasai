"use client"

import { useState } from "react"
import {
  Key, Plus, Copy, Check, Trash2, Search, Shield,
  Zap, BarChart3, TrendingUp, ExternalLink, AlertTriangle,
  X, Download, Globe, ChevronRight, ArrowUpRight
} from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getRateLimitOptions, getPlanLimits } from "@/lib/subscriptions"

interface ApiKey {
  id: string
  name: string
  prefix: string
  status: string
  permissions: string[]
  rateLimit: number
  expiresAt: string | null
  lastUsedAt: string
  createdAt: string
  usageToday: number
  usageMonth: number
  usagePercent: number
}

interface PageData {
  keys: ApiKey[]
  stats: {
    totalKeys: number
    activeKeys: number
    requestsToday: number
    requestsMonth: number
    successRate: number
    avgLatency: number
    rateLimit: number
  }
  plan: {
    tier: string
    requestLimit: number
    requestsUsed: number
  }
  userTier: string
  logs: Array<{
    method: string
    endpoint: string
    statusCode: number
    latency: number
    timestamp: string
    keyId: string | null
  }>
}

const PERMISSION_COLORS: Record<string, string> = {
  read: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  write: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  delete: "bg-red-500/15 text-red-400 border border-red-500/20",
  admin: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
}

const EXPIRY_OPTIONS = [
  { label: "Never", value: null },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
  { label: "180 Days", value: 180 },
  { label: "1 Year", value: 365 },
]

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Active
    </span>
  )
  if (status === "REVOKED") return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      Revoked
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Expired
    </span>
  )
}

type RestrictionType = 'none' | 'ip' | 'domain'

function CreateKeyModal({ onClose, onCreated, onLimitExceeded, userTier }: {
  onClose: () => void
  onCreated: (key: { raw: string; name: string }) => void
  onLimitExceeded: (info: { currentCount: number; limit: number; tier: string; upgradeRequired?: string }) => void
  userTier: string
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  // Step 1
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [permissions, setPermissions] = useState<string[]>(["read"])
  const [rateLimit, setRateLimit] = useState<number>(100)
  const [expiryDays, setExpiryDays] = useState<number | null>(null)
  // Step 2
  const [restrictionType, setRestrictionType] = useState<RestrictionType>('none')
  const [ipInput, setIpInput] = useState("")
  const [allowedIps, setAllowedIps] = useState<string[]>([])
  const [domainInput, setDomainInput] = useState("")
  const [allowedDomains, setAllowedDomains] = useState<string[]>([])
  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createBrowserSupabaseClient()

  const rateLimitOptions = getRateLimitOptions(userTier)
  // Set default to plan max on first render
  const planMax = rateLimitOptions[rateLimitOptions.length - 1]?.value || 100

  const togglePerm = (p: string) =>
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const addIp = () => {
    const val = ipInput.trim()
    if (val && !allowedIps.includes(val)) setAllowedIps(prev => [...prev, val])
    setIpInput("")
  }
  const addDomain = () => {
    const val = domainInput.trim().toLowerCase()
    if (val && !allowedDomains.includes(val)) setAllowedDomains(prev => [...prev, val])
    setDomainInput("")
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError("")
    try {
      const expiresAt = expiryDays
        ? new Date(Date.now() + expiryDays * 86400000).toISOString()
        : null

      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          permissions,
          rateLimit: rateLimit || planMax,
          expiresAt,
          restrictionType,
          allowedIps: restrictionType === 'ip' && allowedIps.length > 0 ? allowedIps : null,
          allowedDomains: restrictionType === 'domain' && allowedDomains.length > 0 ? allowedDomains : null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403 && data.error === "limit_exceeded") {
          onLimitExceeded(data)
          return
        }
        throw new Error(data.message || data.error || "Failed to create API key")
      }

      onCreated({ raw: data.key.raw, name: data.key.name })
    } catch (e: any) {
      console.error(e)
      setError(e.message || "Failed to create API key. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const STEP_LABELS = ['Details', 'Restrictions', 'Review']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0f0f16] border border-white/[0.08] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-white">Create API Key</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold border ${
                    step === i + 1 ? 'bg-amber-500 border-amber-500 text-black'
                    : step > i + 1 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-white/[0.04] border-white/[0.1] text-white/40'
                  }`}>{i + 1}</span>
                  <span className={`text-xs ${ step === i + 1 ? 'text-white' : 'text-white/30'}`}>{label}</span>
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
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Key Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Production API Key"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Description (Optional)</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What will this key be used for?"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Permissions</label>
              <div className="flex gap-2 flex-wrap">
                {['read', 'write', 'delete', 'admin'].map(p => (
                  <button key={p} onClick={() => togglePerm(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      permissions.includes(p) ? PERMISSION_COLORS[p] : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/20'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                  Rate Limit
                  <span className="ml-1 text-amber-400/60 normal-case font-normal">(plan max: {planMax.toLocaleString()}/hr)</span>
                </label>
                <div className="flex flex-col gap-1.5">
                  {rateLimitOptions.map(opt => (
                    <button key={opt.value} onClick={() => setRateLimit(opt.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                        rateLimit === opt.value ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/20'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Expiration</label>
                <div className="flex flex-col gap-1.5">
                  {EXPIRY_OPTIONS.map(opt => (
                    <button key={String(opt.value)} onClick={() => setExpiryDays(opt.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                        expiryDays === opt.value ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/20'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Restrictions */}
        {step === 2 && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-white/50">Restrict which IPs or domains can use this key. Leave unrestricted for global access.</p>
            <div className="flex flex-col gap-2">
              {(['none', 'ip', 'domain'] as RestrictionType[]).map(type => (
                <button key={type} onClick={() => setRestrictionType(type)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    restrictionType === type ? 'border-amber-500/30 bg-amber-500/[0.04]' : 'border-white/[0.08] bg-white/[0.01] hover:border-white/20'
                  }`}>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    restrictionType === type ? 'border-amber-500' : 'border-white/20'
                  }`}>
                    {restrictionType === type && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {type === 'none' ? 'No Restriction' : type === 'ip' ? 'IP Restriction' : 'Domain Restriction'}
                    </p>
                    <p className="text-xs text-white/40">
                      {type === 'none' ? 'Key can be used from any IP or domain'
                       : type === 'ip' ? 'Only allow requests from specific IP addresses'
                       : 'Only allow requests from specific domains'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {restrictionType === 'ip' && (
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Allowed IPs</label>
                <div className="flex gap-2 mb-2">
                  <input value={ipInput} onChange={e => setIpInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addIp()}
                    placeholder="e.g., 192.168.1.1"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-500/50" />
                  <button onClick={addIp} className="px-3 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allowedIps.map(ip => (
                    <span key={ip} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.06] text-xs text-white/70">
                      {ip}
                      <button onClick={() => setAllowedIps(prev => prev.filter(x => x !== ip))} className="text-white/30 hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {restrictionType === 'domain' && (
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Allowed Domains</label>
                <div className="flex gap-2 mb-2">
                  <input value={domainInput} onChange={e => setDomainInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addDomain()}
                    placeholder="e.g., api.example.com"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-500/50" />
                  <button onClick={addDomain} className="px-3 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allowedDomains.map(d => (
                    <span key={d} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.06] text-xs text-white/70">
                      <Globe className="h-3 w-3 text-white/40" />{d}
                      <button onClick={() => setAllowedDomains(prev => prev.filter(x => x !== d))} className="text-white/30 hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="p-5 space-y-3">
            <p className="text-sm text-white/50 mb-4">Review your API key settings before creating.</p>
            {[
              { label: 'Name', value: name },
              { label: 'Description', value: description || '—' },
              { label: 'Permissions', value: permissions.join(', ') },
              { label: 'Rate Limit', value: `${(rateLimit || planMax).toLocaleString()} req/hr` },
              { label: 'Expiration', value: expiryDays ? `${expiryDays} days` : 'Never' },
              { label: 'Restrictions', value: restrictionType === 'none' ? 'None'
                : restrictionType === 'ip' ? `IP: ${allowedIps.join(', ') || 'none set'}`
                : `Domain: ${allowedDomains.join(', ') || 'none set'}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.04]">
                <span className="text-xs text-white/40 flex-shrink-0 w-28">{label}</span>
                <span className="text-sm text-white text-right">{value}</span>
              </div>
            ))}
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        )}

        {/* Footer nav */}
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
              disabled={step === 1 && !name.trim()}
              className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Key className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create API Key'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RevealKeyModal({ rawKey, keyName, onClose }: { rawKey: string; keyName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const content = [
      `MidasAI API Key`,
      `Name: ${keyName}`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `API Key:`,
      rawKey,
      ``,
      `IMPORTANT: Keep this key secret. Do not share it or commit it to version control.`,
      `Store it in a secure password manager or secrets manager.`,
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `midasai-api-key-${keyName.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDone = () => {
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#0f0f16] border border-amber-500/30 rounded-2xl shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Your API Key Has Been Generated</h2>
              <p className="text-sm text-amber-400/80">Copy or download it now — you will never see this key again.</p>
            </div>
          </div>

          {/* Key display */}
          <div className="p-4 rounded-xl bg-black/60 border border-amber-500/20 mb-4">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">API Key</p>
            <code className="text-sm text-amber-400 font-mono break-all leading-relaxed block">{rawKey}</code>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Key'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
            >
              <Download className="h-4 w-4" />
              Download .txt
            </button>
          </div>

          <p className="text-xs text-white/40 mb-4">
            Store this key in a secure password manager. Do not share it or commit it to version control.
          </p>

          <button
            onClick={handleDone}
            className="w-full h-11 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
          >
            I&apos;ve safely stored this key
          </button>
        </div>
      </div>
    </div>
  )
}

function LimitReachedModal({ currentCount, limit, tier, upgradeRequired, onClose }: {
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
            <h2 className="text-base font-semibold text-white">API Key limit reached</h2>
            <p className="text-xs text-white/40 mt-0.5">{currentCount} of {limit === -1 ? "∞" : limit} used on {tier} plan</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-5">
          Your <span className="text-white font-medium">{tier}</span> plan supports <span className="text-amber-400 font-semibold">{limit === -1 ? "unlimited" : limit} API key{limit !== 1 ? "s" : ""}</span>.
          {upgradeRequired && <> Upgrade to <span className="text-amber-400 font-semibold">{upgradeRequired}</span> to create more.</>}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors">Cancel</button>
          <a href="/developer/billing"
            className="flex-1 h-10 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
            Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

function RevokeKeyModal({
  keyName,
  loading,
  onClose,
  onConfirm,
}: {
  keyName: string
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#0f0f16] border border-red-500/30 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Revoke API key?</h2>
            <p className="text-xs text-white/40 mt-0.5">{keyName}</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-5">
          This key will stop working immediately. Any apps or scripts using it will lose access. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-400 transition-colors disabled:opacity-50"
          >
            {loading ? "Revoking..." : "Revoke key"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ApiKeysClient({ data }: { data: PageData }) {
  const [showCreate, setShowCreate] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ currentCount: number; limit: number; tier: string; upgradeRequired?: string } | null>(null)
  const [revealKey, setRevealKey] = useState<{ raw: string; name: string } | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const planLimits = getPlanLimits(data.userTier)
  const maxApiKeys = planLimits.maxApplications
  const atLimit = maxApiKeys !== -1 && data.keys.length >= maxApiKeys

  const { keys, stats, plan, logs, userTier } = data

  const filtered = keys.filter(k => {
    const matchSearch = k.name.toLowerCase().includes(search.toLowerCase()) || k.prefix.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All Status" || k.status === statusFilter.toUpperCase()
    return matchSearch && matchStatus
  })

  const handleRevoke = async (id: string) => {
    setRevoking(id)
    try {
      const res = await fetch(`/api/keys/${id}/revoke`, { method: "POST" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        console.error("Revoke failed:", json.error ?? res.statusText)
        return
      }
      setRevokeTarget(null)
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setRevoking(null)
    }
  }

  const handleCopyPrefix = (prefix: string) => {
    navigator.clipboard.writeText(prefix)
    setCopied(prefix)
    setTimeout(() => setCopied(null), 2000)
  }

  const usagePercent = plan.requestLimit > 0
    ? Math.round((plan.requestsUsed / plan.requestLimit) * 100 * 10) / 10
    : 0

  const planColors: Record<string, string> = {
    FREE: "text-white/60",
    STARTER: "text-blue-400",
    PRO: "text-amber-400",
    BUSINESS: "text-purple-400",
    ENTERPRISE: "text-purple-400",
  }

  return (
    <>
      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(key) => { setShowCreate(false); setRevealKey(key) }}
          onLimitExceeded={(info) => { setShowCreate(false); setLimitInfo(info) }}
          userTier={userTier}
        />
      )}
      {limitInfo && (
        <LimitReachedModal
          currentCount={limitInfo.currentCount}
          limit={limitInfo.limit}
          tier={limitInfo.tier}
          upgradeRequired={limitInfo.upgradeRequired}
          onClose={() => setLimitInfo(null)}
        />
      )}
      {revealKey && (
        <RevealKeyModal rawKey={revealKey.raw} keyName={revealKey.name} onClose={() => setRevealKey(null)} />
      )}
      {revokeTarget && (
        <RevokeKeyModal
          keyName={revokeTarget.name}
          loading={revoking === revokeTarget.id}
          onClose={() => !revoking && setRevokeTarget(null)}
          onConfirm={() => handleRevoke(revokeTarget.id)}
        />
      )}

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">API Keys</h1>
            <p className="text-sm text-white/50">
              Manage your API keys to authenticate requests to MidasAI API.<br />
              Keep your keys secure and never share them publicly.
            </p>
          </div>
          <a
            href="/api-docs"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors"
          >
            View API Documentation
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Stats Grid — matches screenshot */}
        <div className="grid grid-cols-4 gap-4">
          {/* Total API Keys */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <span className="text-xs text-white/40">Total API Keys</span>
            </div>
            <p className="text-3xl font-bold text-white mb-0.5">{stats.totalKeys}</p>
            <p className="text-xs text-white/40">Active keys</p>
            <button onClick={() => setStatusFilter("ACTIVE")} className="text-xs text-blue-400 hover:text-blue-300 mt-2 block transition-colors">
              View all keys →
            </button>
          </div>

          {/* Requests This Month */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-amber-400" />
              </div>
              <span className="text-xs text-white/40">Requests This Month</span>
            </div>
            <p className="text-3xl font-bold text-white mb-0.5">{stats.requestsMonth.toLocaleString()}</p>
            <p className="text-xs text-white/40">{usagePercent}% of {(plan.requestLimit / 1000).toFixed(0)}k limit</p>
            <Link href="/developer/usage" className="text-xs text-amber-400 hover:text-amber-300 mt-2 block transition-colors">
              View analytics →
            </Link>
          </div>

          {/* Rate Limit */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Zap className="h-4.5 w-4.5 text-red-400" />
              </div>
              <span className="text-xs text-white/40">Rate Limit</span>
            </div>
            <p className="text-3xl font-bold text-white mb-0.5">{stats.rateLimit.toLocaleString()}</p>
            <p className="text-xs text-white/40">Requests per hour</p>
            <Link href="/developer/billing" className="text-xs text-red-400 hover:text-red-300 mt-2 block transition-colors">
              Manage limits →
            </Link>
          </div>

          {/* Your Plan */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="h-4.5 w-4.5 text-purple-400" />
              </div>
              <span className="text-xs text-white/40">Your Plan</span>
            </div>
            <p className={`text-2xl font-bold mb-0.5 ${planColors[plan.tier] || 'text-white'}`}>
              {plan.tier === 'PRO' ? 'Pro Plan' : plan.tier === 'ENTERPRISE' ? 'Enterprise' : 'Free Plan'}
            </p>
            <p className="text-xs text-white/40">{(plan.requestLimit / 1000).toFixed(0)}k requests/month</p>
            <Link href="/developer/billing" className="text-xs text-purple-400 hover:text-purple-300 mt-2 block transition-colors">
              Manage plan →
            </Link>
          </div>
        </div>

        {/* Plan usage bar */}
        {maxApiKeys !== -1 && (
          <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <Key className="h-4 w-4 text-white/30 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/50">API Keys used</span>
                <span className={`text-xs font-semibold ${atLimit ? "text-red-400" : "text-white/70"}`}>
                  {data.keys.length} / {maxApiKeys}
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${atLimit ? "bg-red-500" : data.keys.length / maxApiKeys > 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min((data.keys.length / maxApiKeys) * 100, 100)}%` }}
                />
              </div>
            </div>
            {atLimit && (
              <a href="/developer/billing" className="flex-shrink-0 text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                Upgrade <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Create New API Key — single CTA card */}
        <div
          onClick={() => atLimit ? setLimitInfo({ currentCount: data.keys.length, limit: maxApiKeys, tier: userTier, upgradeRequired: userTier === 'FREE' ? 'STARTER' : userTier === 'STARTER' ? 'PRO' : 'BUSINESS' }) : setShowCreate(true)}
          className={`rounded-xl border border-dashed transition-all cursor-pointer p-6 flex items-center justify-between group ${
            atLimit ? "border-red-500/20 bg-red-500/[0.01] hover:border-red-500/30" : "border-white/[0.1] bg-white/[0.01] hover:bg-white/[0.03] hover:border-amber-500/30"
          }`}
        >
          <div>
            <h2 className={`text-base font-semibold transition-colors ${
              atLimit ? "text-red-400" : "text-white group-hover:text-amber-400"
            }`}>
              {atLimit ? `Limit reached — ${userTier} plan allows ${maxApiKeys} API key${maxApiKeys !== 1 ? "s" : ""}` : "Create New API Key"}
            </h2>
            <p className="text-sm text-white/40 mt-0.5">
              {atLimit ? "Upgrade your plan to create more API keys." : "Generate a new API key with custom permissions and rate limits."}
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); atLimit ? setLimitInfo({ currentCount: data.keys.length, limit: maxApiKeys, tier: userTier, upgradeRequired: userTier === 'FREE' ? 'STARTER' : userTier === 'STARTER' ? 'PRO' : 'BUSINESS' }) : setShowCreate(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex-shrink-0"
          >
            {atLimit ? <><ArrowUpRight className="h-4 w-4" /> Upgrade Plan</> : <><Plus className="h-4 w-4" /> Generate API Key</>}
          </button>
        </div>

        {/* API Keys Table */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-semibold text-white">Your API Keys</h2>
              <p className="text-sm text-white/40 mt-0.5">Manage and monitor your API keys.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search keys..."
                  className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/30 w-48"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 focus:outline-none focus:border-amber-500/30"
              >
                <option>All Status</option>
                <option>ACTIVE</option>
                <option>REVOKED</option>
                <option>EXPIRED</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">No API Keys Yet</h3>
              <p className="text-sm text-white/40 mb-6 max-w-sm">
                Create your first production API key to connect apps, automations, workflows and MCP servers.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Generate API Key
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['KEY NAME', 'PERMISSIONS', 'RATE LIMIT', 'USAGE (THIS MONTH)', 'STATUS', 'LAST USED', 'ACTIONS'].map(col => (
                    <th key={col} className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((key, i) => (
                  <tr
                    key={key.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === filtered.length - 1 ? 'border-b-0' : ''}`}
                  >
                    {/* Key Name */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{key.name}</p>
                        <p className="text-xs text-white/30 mt-0.5 font-mono">Created {key.createdAt}</p>
                      </div>
                    </td>

                    {/* Permissions */}
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {key.permissions.map(p => (
                          <span key={p} className={`px-2 py-0.5 rounded text-xs font-medium border ${PERMISSION_COLORS[p] || 'bg-white/[0.04] text-white/50 border-white/[0.08]'}`}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Rate Limit */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-white/70">{key.rateLimit.toLocaleString()} / hour</span>
                    </td>

                    {/* Usage */}
                    <td className="px-5 py-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white">{key.usageMonth.toLocaleString()}</span>
                          <span className="text-xs text-white/40">{key.usagePercent}%</span>
                        </div>
                        <div className="h-1 bg-white/[0.08] rounded-full w-24 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${Math.min(key.usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={key.status} />
                      {key.expiresAt && key.status === 'ACTIVE' && (
                        <p className="text-xs text-amber-400/70 mt-1">
                          Expires {new Date(key.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>

                    {/* Last Used */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-white/60">{key.lastUsedAt}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyPrefix(key.prefix)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-white/60 hover:text-white hover:border-white/20 transition-colors"
                        >
                          {copied === key.prefix ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          View
                        </button>
                        {key.status === 'ACTIVE' && (
                          <button
                            onClick={() => setRevokeTarget({ id: key.id, name: key.name })}
                            disabled={revoking === key.id}
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Security Best Practices */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
          <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <p className="text-sm text-white/50">
            Store your API keys securely and never expose them in client-side code.{" "}
            <a href="/api-docs/security" className="text-amber-400 hover:text-amber-300 transition-colors">
              Learn more about API security →
            </a>
          </p>
        </div>

        {/* Recent Activity */}
        {logs.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white">Recent API Activity</h2>
              <Link href="/developer/logs" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                View all logs →
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold font-mono ${
                    log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                    log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.method === 'DELETE' ? 'bg-red-500/10 text-red-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>{log.method}</span>
                  <span className="text-sm font-mono text-white/70 flex-1 truncate">{log.endpoint}</span>
                  <span className={`text-xs font-medium ${
                    log.statusCode >= 200 && log.statusCode < 300 ? 'text-emerald-400' :
                    log.statusCode >= 400 ? 'text-red-400' : 'text-white/50'
                  }`}>{log.statusCode}</span>
                  <span className="text-xs text-white/40 w-16 text-right">{log.latency}ms</span>
                  <span className="text-xs text-white/30 w-16 text-right">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
