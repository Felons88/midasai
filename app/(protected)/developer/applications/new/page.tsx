"use client"

import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Package, ArrowLeft, Copy, Check, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewApplicationPage() {
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<{ clientId: string; clientSecret: string } | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [website, setWebsite] = useState("")
  const [callbackUrl, setCallbackUrl] = useState("")
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const handleCreateApplication = async () => {
    if (!name.trim() || !website.trim() || !callbackUrl.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Generate client ID and secret
      const clientId = `app_${Buffer.from(Date.now().toString()).toString('base64').substring(0, 16)}`
      const clientSecret = Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64').substring(0, 32)

      const { error } = await supabase.from('applications').insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim(),
        website: website.trim(),
        callback_url: callbackUrl.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        status: 'ACTIVE',
      })

      if (error) throw error

      setCredentials({ clientId, clientSecret })
    } catch (error) {
      console.error('Error creating application:', error)
      alert('Failed to create application')
    } finally {
      setLoading(false)
    }
  }

  const handleCopySecret = () => {
    if (credentials?.clientSecret) {
      navigator.clipboard.writeText(credentials.clientSecret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const handleContinue = () => {
    router.push('/developer/applications')
  }

  if (credentials) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/developer/applications" className="flex items-center gap-2 text-white/60 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Application Created</h1>
          <p className="text-white/60">Save your credentials now. You won&apos;t be able to see the client secret again.</p>
        </div>

        <div className="space-y-4">
          {/* Client ID */}
          <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.1]">
            <label className="block text-xs font-medium text-white/30 mb-2">Client ID</label>
            <div className="flex items-center justify-between">
              <code className="text-sm text-white font-mono">{credentials.clientId}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigator.clipboard.writeText(credentials.clientId)}
                className="ml-2 flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Client Secret */}
          <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/[0.05]">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-400">
                Save this client secret securely. For security reasons, we won&apos;t show it to you again.
              </p>
            </div>
            <label className="block text-xs font-medium text-white/30 mb-2">Client Secret</label>
            <div className="flex items-center justify-between p-3 rounded-lg bg-black/50 border border-white/[0.1]">
              <code className="text-sm text-amber-400 font-mono">{credentials.clientSecret}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopySecret}
                className="ml-2 flex-shrink-0"
              >
                {copiedSecret ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full bg-amber-500 text-black hover:bg-amber-400"
          >
            I&apos;ve saved my credentials
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/developer/applications" className="flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Create Application</h1>
        <p className="text-white/60">Register a new OAuth application for third-party integrations</p>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Application Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Integration"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your application does"
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Application Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://your-app.com"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Callback URL */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Callback URL</label>
          <input
            type="url"
            value={callbackUrl}
            onChange={(e) => setCallbackUrl(e.target.value)}
            placeholder="https://your-app.com/auth/callback"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
          <p className="text-xs text-white/40 mt-1">The URL where users will be redirected after authorization</p>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateApplication}
          disabled={loading || !name.trim() || !website.trim() || !callbackUrl.trim()}
          className="w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Application'}
        </Button>
      </div>
    </div>
  )
}
