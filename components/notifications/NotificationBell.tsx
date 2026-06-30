"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

type NotificationItem = {
  id: string
  title: string
  message: string
  read: boolean | null
  created_at: string | null
  action_url: string | null
  action_label: string | null
}

interface NotificationBellProps {
  userId: string
}

function formatWhen(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const refreshCount = useCallback(async () => {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false)
    setUnreadCount(count ?? 0)
  }, [supabase, userId])

  const loadRecent = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, read, created_at, action_url, action_label")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8)
    setItems(data ?? [])
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    refreshCount()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshCount()
          if (open) loadRecent()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, refreshCount, open, loadRecent])

  useEffect(() => {
    if (open) loadRecent()
  }, [open, loadRecent])

  async function markAllRead() {
    const now = new Date().toISOString()
    await supabase
      .from("notifications")
      .update({ read: true, read_at: now })
      .eq("user_id", userId)
      .eq("read", false)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.read) {
      const now = new Date().toISOString()
      await supabase
        .from("notifications")
        .update({ read: true, read_at: now })
        .eq("id", item.id)
        .eq("user_id", userId)
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    setOpen(false)
    if (item.action_url) {
      router.push(item.action_url)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-text-secondary hover:text-text-primary"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[10px] font-bold text-primary">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-[#0c0c12] border-white/10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.65)] z-[200]">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-white">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>

        {loading && items.length === 0 ? (
          <p className="px-3 py-6 text-sm text-white/40 text-center">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-sm text-white/40 text-center">No notifications yet</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="flex flex-col items-start gap-0.5 px-3 py-2.5 cursor-pointer rounded-none border-b border-white/5 focus:bg-white/5"
                onSelect={(e) => {
                  e.preventDefault()
                  handleItemClick(item)
                }}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span
                    className={`text-sm font-medium truncate ${
                      item.read ? "text-white/60" : "text-white"
                    }`}
                  >
                    {item.title}
                  </span>
                  {!item.read && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-white/45 line-clamp-2 w-full">{item.message}</p>
                <span className="text-[10px] text-white/30">{formatWhen(item.created_at)}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator className="bg-white/10 m-0" />
        <DropdownMenuItem asChild className="justify-center py-2.5 text-xs text-amber-400 focus:text-amber-300">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
