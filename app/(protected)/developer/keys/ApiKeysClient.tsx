"use client"

import { useState } from "react"
import {
  Key, Plus, Copy, Check, Trash2, MoreHorizontal, Search, Shield,
  Zap, BarChart3, TrendingUp, Clock, ExternalLink, AlertTriangle,
  ChevronDown, X, Eye, EyeOff, Activity, CheckCircle, XCircle
} from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

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

const RATE_LIMIT_OPTIONS = [
  { label: "100 / hr", value: 100 },
  { label: "1,000 / hr", value: 1000 },
  { label: "10,000 / hr", value: 10000 },
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

function CreateKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const [name, setName] = useState("")
  const [permissions, setPermissions] = useState<string[]>(["read"])
  const [rateLimit, setRateLimit] = useState(1000)
  const [expiryDays, setExpiryDays] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserSupabaseClient()

  const togglePerm = (p: string) =>
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const rawKey = `midas_live_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
      const keyPrefix = rawKey.substring(0, 16)
      const expiresAt = expiryDays
        ? new Date(Date.now() + expiryDays * 86400000).toISOString()
        : null

      const encoder = new TextEncoder()
      const keyData = encoder.encode(rawKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData)
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name: name.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        key_value: rawKey,
        permissions,
        rate_limit: rateLimit,
        expires_at: expiresAt,
        status: 'ACTIVE',
      })
      if (error) throw error
      onCreated(rawKey)
    } catch (e) {
      console.error(e)
      alert("Failed to create API key")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#0f0f16] border border-white/[0.08] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white">Create New API Key</h2>
            <p className="text-sm text-white/50 mt-0.5">Generate a new API key with custom permissions and rate limits.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Key Name */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Key Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Production API Key"
              className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Permissions</label>
            <div className="flex gap-2 flex-wrap">
              {['read', 'write', 'delete', 'admin'].map(p => (
                <button
                  key={p}
                  onClick={() => togglePerm(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    permissions.includes(p)
                      ? PERMISSION_COLORS[p]
                      : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Rate Limit + Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Rate Limit</label>
              <div className="flex flex-col gap-1.5">
                {RATE_LIMIT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRateLimit(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                      rateLimit === opt.value
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Expiration</label>
              <div className="flex flex-col gap-1.5">
                {EXPIRY_OPTIONS.map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setExpiryDays(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                      expiryDays === opt.value
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.06]">
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            <Key className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create API Key'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RevealKeyModal({ rawKey, onClose }: { rawKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleCopy = () => {
    navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDone = () => {
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#0f0f16] border border-amber-500/30 rounded-2xl shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Save Your API Key</h2>
              <p className="text-sm text-amber-400/80">You will never be able to view this key again.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/[0.1] mb-4">
            <div className="flex items-start justify-between gap-3">
              <code className="text-sm text-amber-400 font-mono break-all leading-relaxed">{rawKey}</code>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/60" />}
              </button>
            </div>
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

export default function ApiKeysClient({ data }: { data: PageData }) {
  const [showCreate, setShowCreate] = useState(false)
  const [revealKey, setRevealKey] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const { keys, stats, plan, logs } = data

  const filtered = keys.filter(k => {
    const matchSearch = k.name.toLowerCase().includes(search.toLowerCase()) || k.prefix.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "All Status" || k.status === statusFilter.toUpperCase()
    return matchSearch && matchStatus
  })

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return
    setRevoking(id)
    try {
      await supabase.from('api_keys').update({ status: 'REVOKED' }).eq('id', id)
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
    PRO: "text-amber-400",
    ENTERPRISE: "text-purple-400",
  }

  return (
    <>
      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreated={(key) => { setShowCreate(false); setRevealKey(key) }}
        />
      )}
      {revealKey && (
        <RevealKeyModal rawKey={revealKey} onClose={() => setRevealKey(null)} />
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

        {/* Create New API Key inline form */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Create New API Key</h2>
            <p className="text-sm text-white/40 mt-0.5">
              Generate a new API key with custom permissions and rate{" "}
              <Link href="/api-docs/rate-limits" className="text-amber-400 hover:underline">limits</Link>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Key Name</label>
              <input
                onClick={() => setShowCreate(true)}
                readOnly
                placeholder="e.g., Production API Key"
                className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/40 placeholder:text-white/30 focus:outline-none text-sm cursor-pointer hover:border-white/20 transition-colors"
              />
              <div className="mt-3">
                <label className="block text-sm font-medium text-white/60 mb-2">Permissions</label>
                <div className="flex gap-2">
                  {['read', 'write', 'delete', 'admin'].map(p => (
                    <span key={p} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${PERMISSION_COLORS[p]}`}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Rate Limit (requests/hour)</label>
                <input
                  readOnly
                  value="1000"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 text-sm focus:outline-none"
                />
                <p className="text-xs text-white/30 mt-1">Maximum requests per hour for this key</p>
                <label className="block text-sm font-medium text-white/60 mt-3 mb-2">IP Restrictions (Optional)</label>
                <input
                  readOnly
                  placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/40 placeholder:text-white/30 text-sm focus:outline-none"
                />
                <p className="text-xs text-white/30 mt-1">Leave empty for no restrictions</p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
              >
                <Key className="h-4 w-4" />
                Create API Key
              </button>
            </div>
          </div>
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
                            onClick={() => handleRevoke(key.id)}
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
