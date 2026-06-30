"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CreateApiKeyForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/developers/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed to create API key")
        return
      }

      setSecret(data.secret)
      router.refresh()
    } catch {
      setError("Failed to create API key")
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!secret) return
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (secret) {
    return (
      <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
        <p className="text-sm text-amber-400 font-medium mb-2">API key created — copy it now</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-white/80 break-all p-2 rounded bg-black/40">
            {secret}
          </code>
          <Button type="button" size="sm" variant="ghost" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <Button
          type="button"
          className="mt-3"
          size="sm"
          onClick={() => {
            setSecret(null)
            setOpen(false)
            setName("")
          }}
        >
          Done
        </Button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create API Key
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
      <h3 className="text-sm font-semibold text-white">New API key</h3>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Key name (e.g. Production)"
        required
        className="bg-black/40 border-white/10"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
