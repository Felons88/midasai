"use client"

import { useState } from "react"
import { Bell, Megaphone, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminCommunicationsPanel() {
  const [notifyTitle, setNotifyTitle] = useState("")
  const [notifyMessage, setNotifyMessage] = useState("")
  const [notifyTarget, setNotifyTarget] = useState("all")
  const [notifyBusy, setNotifyBusy] = useState(false)
  const [notifyResult, setNotifyResult] = useState<string | null>(null)

  const [clTitle, setClTitle] = useState("")
  const [clBody, setClBody] = useState("")
  const [clVersion, setClVersion] = useState("")
  const [clTarget, setClTarget] = useState("all")
  const [clAlsoNotify, setClAlsoNotify] = useState(true)
  const [clBusy, setClBusy] = useState(false)
  const [clResult, setClResult] = useState<string | null>(null)

  async function sendNotification(e: React.FormEvent) {
    e.preventDefault()
    setNotifyBusy(true)
    setNotifyResult(null)
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: notifyTitle,
          message: notifyMessage,
          target: notifyTarget,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      setNotifyResult(`Sent to ${data.sent} user(s).`)
      setNotifyTitle("")
      setNotifyMessage("")
    } catch (err) {
      setNotifyResult(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setNotifyBusy(false)
    }
  }

  async function publishChangelog(e: React.FormEvent) {
    e.preventDefault()
    setClBusy(true)
    setClResult(null)
    try {
      const res = await fetch("/api/admin/announcements/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: clTitle,
          body: clBody,
          version: clVersion || undefined,
          target_role: clTarget,
          also_notify: clAlsoNotify,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      setClResult(
        `Changelog published${data.notified ? ` — ${data.notified} notification(s) sent` : ""}. Users see the popup once when they visit /dashboard.`
      )
      setClTitle("")
      setClBody("")
      setClVersion("")
    } catch (err) {
      setClResult(err instanceof Error ? err.message : "Failed to publish")
    } finally {
      setClBusy(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mt-8">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-4 w-4 text-cta" />
            Send notification
          </CardTitle>
          <CardDescription>
            Push an in-app notification to users (appears in the bell dropdown).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendNotification} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="notify-title">Title</Label>
              <Input
                id="notify-title"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                placeholder="Maintenance tonight"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notify-message">Message</Label>
              <Textarea
                id="notify-message"
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="We'll be down for upgrades from 2–3am UTC."
                required
                rows={3}
                maxLength={2000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={notifyTarget} onValueChange={setNotifyTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="USER">Users only</SelectItem>
                  <SelectItem value="CREATOR">Creators only</SelectItem>
                  <SelectItem value="ADMIN">Admins only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {notifyResult && (
              <p className="text-sm text-text-secondary">{notifyResult}</p>
            )}
            <Button type="submit" disabled={notifyBusy} className="w-full">
              <Megaphone className="h-4 w-4 mr-2" />
              {notifyBusy ? "Sending…" : "Send notification"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cta" />
            Changelog popup
          </CardTitle>
          <CardDescription>
            One-time modal on /dashboard until the user clicks Confirm. Confirmations are logged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={publishChangelog} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cl-title">Title</Label>
                <Input
                  id="cl-title"
                  value={clTitle}
                  onChange={(e) => setClTitle(e.target.value)}
                  placeholder="Creator payouts live"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cl-version">Version (optional)</Label>
                <Input
                  id="cl-version"
                  value={clVersion}
                  onChange={(e) => setClVersion(e.target.value)}
                  placeholder="1.4.0"
                  maxLength={40}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-body">Changelog body</Label>
              <Textarea
                id="cl-body"
                value={clBody}
                onChange={(e) => setClBody(e.target.value)}
                placeholder="- Stripe Connect payouts&#10;- MCP server tools&#10;- Faster marketplace search"
                required
                rows={5}
                maxLength={8000}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={clTarget} onValueChange={setClTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="USER">Users only</SelectItem>
                  <SelectItem value="CREATOR">Creators only</SelectItem>
                  <SelectItem value="ADMIN">Admins only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={clAlsoNotify}
                onChange={(e) => setClAlsoNotify(e.target.checked)}
                className="rounded border-white/20"
              />
              Also send bell notification
            </label>
            {clResult && <p className="text-sm text-text-secondary">{clResult}</p>}
            <Button type="submit" disabled={clBusy} className="w-full">
              {clBusy ? "Publishing…" : "Publish changelog popup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
