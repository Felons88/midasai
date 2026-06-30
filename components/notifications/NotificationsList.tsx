"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { AppNotification } from "@/components/notifications/NotificationProvider"
import { NotificationDetailModal } from "@/components/notifications/NotificationDetailModal"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type NotificationsListProps = {
  initialNotifications: AppNotification[]
  userId: string
}

export function NotificationsList({ initialNotifications, userId }: NotificationsListProps) {
  const [items, setItems] = useState(initialNotifications)
  const [selected, setSelected] = useState<AppNotification | null>(null)
  const supabase = createClient()

  async function markRead(id: string) {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, read_at: now } : n)))
    await supabase.from("notifications").update({ read: true, read_at: now }).eq("id", id).eq("user_id", userId)
  }

  async function openNotification(n: AppNotification) {
    let notification = n
    const meta = n.metadata ?? {}
    if (
      typeof meta.changelog_id === "string" &&
      !meta.changelog_body
    ) {
      try {
        const res = await fetch(`/api/announcements/${meta.changelog_id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.announcement) {
            notification = {
              ...n,
              metadata: {
                ...meta,
                changelog_body: data.announcement.body,
                changelog_version: data.announcement.version,
                changelog_title: data.announcement.title,
              },
            }
          }
        }
      } catch {
        // use message fallback
      }
    }
    setSelected(notification)
  }

  return (
    <>
      <div className="space-y-3">
        {items.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => openNotification(notification)}
            className={`w-full text-left rounded-xl border p-5 transition hover:border-amber-500/30 hover:bg-white/[0.03] ${
              notification.read ? "border-white/[0.06] bg-white/[0.01]" : "border-amber-500/25 bg-amber-500/[0.03]"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full shrink-0 ${notification.read ? "bg-white/[0.04]" : "bg-amber-500/10"}`}>
                <Bell className={`h-4 w-4 ${notification.read ? "text-white/30" : "text-amber-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-1">{notification.title}</h3>
                <p className="text-white/55 text-sm line-clamp-2">{notification.message}</p>
                <p className="text-xs text-white/30 mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              {!notification.read && <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 mt-2" />}
            </div>
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-24">
          <Bell className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <p className="text-xl text-white/50">No notifications yet.</p>
          <Button className="mt-6" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      )}

      <NotificationDetailModal
        notification={selected}
        onClose={() => setSelected(null)}
        onMarkRead={markRead}
      />
    </>
  )
}
