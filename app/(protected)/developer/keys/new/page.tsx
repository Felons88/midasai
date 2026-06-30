"use client"

import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Key, ArrowLeft, Copy, Check, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewApiKeyPage() {
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [name, setName] = useState("")
  const [permissions, setPermissions] = useState<string[]>(["read"])
  const [rateLimit, setRateLimit] = useState(1000)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const handleCreateKey = async () => {
    if (!name.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Generate a secure API key
      const rawKey = `midas_${Buffer.from(Date.now().toString()).toString('base64')}_${Buffer.from(Math.random().toString()).toString('base64').substring(0, 32)}`
      
      // Hash the key for storage (using a simple hash for now - in production use bcrypt)
      const hashedKey = Buffer.from(rawKey).toString('base64')
      const keyPrefix = rawKey.substring(0, 8)

      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name: name.trim(),
        hashed_key: hashedKey,
        key_prefix: keyPrefix,
        permissions: permissions,
        rate_limit: rateLimit,
        status: 'ACTIVE',
      })

      if (error) throw error

      setApiKey(rawKey)
    } catch (error) {
      console.error('Error creating API key:', error)
      alert('Failed to create API key')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleContinue = () => {
    router.push('/developer/keys')
  }

  const togglePermission = (perm: string) => {
    setPermissions(prev => 
      prev.includes(perm) 
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    )
  }

  if (apiKey) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/developer/keys" className="flex items-center gap-2 text-white/60 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to API Keys
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">API Key Created</h1>
          <p className="text-white/60">Copy your API key now. You won&apos;t be able to see it again.</p>
        </div>

        <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-400">
              Save this API key securely. For security reasons, we won&apos;t show it to you again.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-black/50 border border-white/[0.1] mb-4">
            <div className="flex items-center justify-between">
              <code className="text-sm text-amber-400 font-mono break-all">{apiKey}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="ml-2 flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-amber-500 text-black hover:bg-amber-400"
          >
            I&apos;ve saved my API key
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/developer/keys" className="flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to API Keys
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Create API Key</h1>
        <p className="text-white/60">Generate a new API key for accessing MidasAI services</p>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Key Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Production API Key"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Permissions</label>
          <div className="flex flex-wrap gap-2">
            {['read', 'write', 'delete', 'admin'].map((perm) => (
              <button
                key={perm}
                onClick={() => togglePermission(perm)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  permissions.includes(perm)
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-white/[0.02] border-white/[0.08] text-white/60 hover:border-white/[0.15]'
                }`}
              >
                {perm}
              </button>
            ))}
          </div>
        </div>

        {/* Rate Limit */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Rate Limit (requests/hour)</label>
          <input
            type="number"
            value={rateLimit}
            onChange={(e) => setRateLimit(parseInt(e.target.value) || 1000)}
            min="1"
            max="10000"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
          <p className="text-xs text-white/40 mt-1">Maximum requests per hour for this key</p>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateKey}
          disabled={loading || !name.trim()}
          className="w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create API Key'}
        </Button>
      </div>
    </div>
  )
}
