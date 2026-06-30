"use client"

import { useState, useRef, useEffect } from "react"
import {
  Bell, X, CheckCheck, Search, Filter,
  CreditCard, Megaphone, ShoppingBag, MessageSquare,
  Briefcase, Zap, Sparkles, Info, Circle
} from "lucide-react"
import { useNotifications, AppNotification } from "./NotificationProvider"
import Link from "next/link"

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  BILLING:      CreditCard,
  PROMOTIONS:   Megaphone,
  MARKETPLACE:  ShoppingBag,
  MESSAGES:     MessageSquare,
  LEADS:        Briefcase,
  JOBS:         Briefcase,
  AI_ASSISTANT: Sparkles,
  ANNOUNCEMENTS:Megaphone,
  SYSTEM:       Info,
  PURCHASE:     ShoppingBag,
  REVIEW:       Bell,
  DOWNLOAD:     Zap,
  BOOKMARK:     Bell,
  MODERATION:   Info,
}

const CATEGORY_COLORS: Record<string, string> = {
  BILLING:      "text-amber-400 bg-amber-500/10",
  PROMOTIONS:   "text-purple-400 bg-purple-500/10",
  MARKETPLACE:  "text-blue-400 bg-blue-500/10",
  MESSAGES:     "text-emerald-400 bg-emerald-500/10",
  LEADS:        "text-orange-400 bg-orange-500/10",
  JOBS:         "text-cyan-400 bg-cyan-500/10",
  AI_ASSISTANT: "text-violet-400 bg-violet-500/10",
  ANNOUNCEMENTS:"text-rose-400 bg-rose-500/10",
  SYSTEM:       "text-white/60 bg-white/[0.06]",
  PURCHASE:     "text-emerald-400 bg-emerald-500/10",
  REVIEW:       "text-amber-400 bg-amber-500/10",
  DOWNLOAD:     "text-blue-400 bg-blue-500/10",
  BOOKMARK:     "text-rose-400 bg-rose-500/10",
  MODERATION:   "text-red-400 bg-red-500/10",
}

const ALL_CATEGORIES = ["All", "SYSTEM", "BILLING", "MARKETPLACE", "MESSAGES", "PROMOTIONS", "AI_ASSISTANT", "ANNOUNCEMENTS"]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function NotificationItem({
  n,
  onOpen,
}: {
  n: AppNotification
  onOpen: (n: AppNotification) => void
}) {
  const Icon = CATEGORY_ICONS[n.type] || Bell
  const colorClass = CATEGORY_COLORS[n.type] || CATEGORY_COLORS.SYSTEM

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-white/[0.04] last:border-0 ${
        !n.read ? "bg-amber-500/[0.015]" : ""
      }`}
      onClick={() => onOpen(n)}
    >
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-tight ${n.read ? "text-white/60" : "text-white"}`}>
            {n.title}
          </p>
          <span className="text-[10px] text-white/30 flex-shrink-0 mt-0.5">{timeAgo(n.created_at)}</span>
        </div>
        <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{n.message}</p>
        {n.action_url && n.action_label && (
          <span
            className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-400"
            onClick={(e) => e.stopPropagation()}
          >
            {n.action_label} →
          </span>
        )}
      </div>
      {!n.read && (
        <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5 animate-notification-dot" />
      )}
    </div>
  )
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const { notifications, unreadCount, markAllRead, loading, openNotification } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)

  function handleOpen(n: AppNotification) {
    setOpen(false)
    openNotification(n)
  }

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = notifications.filter(n => {
    const matchesFilter = filter === "All" || n.type === filter
    const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center h-9 w-9 rounded-xl hover:bg-white/[0.06] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-white/60 hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center animate-notification-dot">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-[380px] rounded-2xl border border-white/10 bg-[#0c0c12] shadow-[0_20px_60px_rgba(0,0,0,0.65)] z-[200] overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors text-white/30">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-white/[0.04]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <Search className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto border-b border-white/[0.04] scrollbar-hide">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filter === cat
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-white/40 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {cat === "All" ? "All" : cat.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <Bell className="h-10 w-10 text-white/10 mb-3" />
                <p className="text-sm font-semibold text-white/40">
                  {search ? "No matching notifications" : "All caught up!"}
                </p>
                <p className="text-xs text-white/25 mt-1">
                  {search ? "Try a different search term" : "No new notifications right now."}
                </p>
              </div>
            ) : (
              filtered.map(n => (
                <NotificationItem key={n.id} n={n} onOpen={handleOpen} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-white/[0.06] text-center">
              <p className="text-xs text-white/30">
                Showing {filtered.length} of {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
