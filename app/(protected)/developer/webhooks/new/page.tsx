"use client"

import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Bell, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewWebhookPage() {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [events, setEvents] = useState<string[]>(["api.created"])
  const [secret, setSecret] = useState("")
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const availableEvents = [
    "api.created",
    "api.updated",
    "api.deleted",
    "user.created",
    "user.updated",
    "subscription.created",
    "subscription.updated",
    "subscription.cancelled",
  ]

  const handleCreateWebhook = async () => {
    if (!name.trim() || !url.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Generate a secure signing secret if not provided
      const webhookSecret = secret || `whsec_${Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64').substring(0, 32)}`

      const { error } = await supabase.from('webhooks').insert({
        user_id: user.id,
        name: name.trim(),
        url: url.trim(),
        events: events,
        secret: webhookSecret,
        status: 'ACTIVE',
        total_deliveries: 0,
        failed_deliveries: 0,
      })

      if (error) throw error

      router.push('/developer/webhooks')
    } catch (error) {
      console.error('Error creating webhook:', error)
      alert('Failed to create webhook')
    } finally {
      setLoading(false)
    }
  }

  const toggleEvent = (event: string) => {
    setEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/developer/webhooks" className="flex items-center gap-2 text-white/60 hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Webhooks
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Create Webhook</h1>
        <p className="text-white/60">Configure a new webhook to receive real-time events</p>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Webhook Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Production Webhook"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Endpoint URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-domain.com/webhook"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
          <p className="text-xs text-white/40 mt-1">HTTPS endpoint that will receive webhook events</p>
        </div>

        {/* Events */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Events to Subscribe</label>
          <div className="grid grid-cols-2 gap-2">
            {availableEvents.map((event) => (
              <button
                key={event}
                onClick={() => toggleEvent(event)}
                className={`px-4 py-2 rounded-lg border transition-all text-left ${
                  events.includes(event)
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-white/[0.02] border-white/[0.08] text-white/60 hover:border-white/[0.15]'
                }`}
              >
                {event}
              </button>
            ))}
          </div>
        </div>

        {/* Secret */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Signing Secret (Optional)</label>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Auto-generated if left blank"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
          <p className="text-xs text-white/40 mt-1">Used to verify webhook signatures. Leave blank to auto-generate.</p>
        </div>

        {/* Warning */}
        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.05]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-400">
              Make sure your endpoint can handle POST requests and returns a 2xx status code within 30 seconds.
            </p>
          </div>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateWebhook}
          disabled={loading || !name.trim() || !url.trim()}
          className="w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Webhook'}
        </Button>
      </div>
    </div>
  )
}
