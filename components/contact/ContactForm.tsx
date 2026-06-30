"use client"

import { useState } from "react"
import { trackEvent } from "@/lib/analytics"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Failed to send message")
      return
    }

    setDone(true)
    trackEvent("contact_submitted")
    setName("")
    setEmail("")
    setMessage("")
  }

  if (done) {
    return (
      <p className="text-text-secondary text-center py-6">
        Thanks — we received your message and will respond soon.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className="mt-1"
          rows={5}
          required
        />
      </div>
      {error && <p className="text-sm text-accent-red">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending..." : "Send message"}
      </Button>
    </form>
  )
}
