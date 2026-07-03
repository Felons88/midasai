"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bell } from "lucide-react"

const TYPES = ["SYSTEM", "MODERATION", "BILLING", "MARKETPLACE"]

export function UserNotifyButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState("SYSTEM")
  const [actionUrl, setActionUrl] = useState("")
  const [busy, setBusy] = useState(false)

  async function send() {
    if (!title.trim() || !message.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          action_url: actionUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      setTitle("")
      setMessage("")
      setActionUrl("")
      setOpen(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to send notification")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs h-9">
          <Bell className="h-3.5 w-3.5" />
          Notify
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0c0c12] border-white/[0.08]">
        <DialogHeader>
          <DialogTitle className="text-white">Send notification</DialogTitle>
          <DialogDescription className="text-white/50">
            The user will receive this in their notification center.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white/[0.03] border-white/[0.06]"
          />
          <Textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-white/[0.03] border-white/[0.06] min-h-[100px]"
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-white/[0.03] border-white/[0.06]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Action URL (optional)"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            className="bg-white/[0.03] border-white/[0.06]"
          />
          <Button onClick={send} disabled={busy || !title.trim() || !message.trim()} className="w-full">
            {busy ? "Sending..." : "Send notification"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
