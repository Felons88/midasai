"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { McpSetupModal } from "@/components/mcp/McpSetupModal"
import { createMcpConnectionAction } from "@/app/(protected)/developer/mcp/actions"
import { getSiteUrl } from "@/lib/site-url"

export function CreateMcpServerForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ token: string; name: string } | null>(null)
  const siteUrl = getSiteUrl()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await createMcpConnectionAction(name.trim())
      if (!result.ok) throw new Error(result.error)
      setCreated({ token: result.token, name: result.server.name })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  if (created) {
    return (
      <>
        <McpSetupModal
          token={created.token}
          connectionName={created.name}
          siteUrl={siteUrl}
          onClose={() => router.push("/developer/mcp")}
        />
        <p className="text-sm text-white/50">Opening setup instructions…</p>
      </>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="name">Server name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Cursor MCP"
          required
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Role-scoped context for my AI assistant"
          rows={3}
          maxLength={500}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy ? "Creating…" : "Create MCP server"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
