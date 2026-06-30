"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Send } from "lucide-react"

interface ComposeMessageFormProps {
  defaultReceiverId?: string
  defaultSubject?: string
}

export function ComposeMessageForm({
  defaultReceiverId = "",
  defaultSubject = "",
}: ComposeMessageFormProps) {
  const [receiverId, setReceiverId] = useState(defaultReceiverId)
  const [subject, setSubject] = useState(defaultSubject)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          subject: subject.trim() || undefined,
          content: content.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to send")
        return
      }

      setSubject("")
      setContent("")
      router.refresh()
    } catch {
      setError("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 glass rounded-xl">
      <h3 className="font-semibold text-text-primary">New message</h3>
      {!defaultReceiverId && (
        <div className="space-y-2">
          <Label htmlFor="receiver-id">Recipient user ID</Label>
          <Input
            id="receiver-id"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            placeholder="UUID of recipient"
            required
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Optional subject"
          maxLength={200}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Message</Label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={5000}
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/50"
          placeholder="Write your message…"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="gap-2">
        <Send className="h-4 w-4" />
        {loading ? "Sending…" : "Send"}
      </Button>
    </form>
  )
}
