"use client"

import { X, Bell, CreditCard, Megaphone, ShoppingBag, MessageSquare, Briefcase, Zap, Sparkles, Info } from "lucide-react"
import { useNotifications } from "./NotificationProvider"
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

const PRIORITY_STYLES: Record<string, string> = {
  LOW:    "border-white/[0.08] bg-[#0f0f18]/95",
  NORMAL: "border-white/[0.12] bg-[#0f0f18]/95",
  HIGH:   "border-amber-500/30 bg-[#0f0f18]/95",
  URGENT: "border-red-500/40 bg-[#120a0a]/95",
}

const PRIORITY_BAR: Record<string, string> = {
  LOW:    "bg-white/20",
  NORMAL: "bg-amber-500",
  HIGH:   "bg-amber-400",
  URGENT: "bg-red-500",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export function NotificationToastStack() {
  const { toasts, dismissToast } = useNotifications()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.slice(0, 4).map(toast => {
        const Icon = CATEGORY_ICONS[toast.type] || Bell
        const priorityStyle = PRIORITY_STYLES[toast.priority] || PRIORITY_STYLES.NORMAL
        const barColor = PRIORITY_BAR[toast.priority] || PRIORITY_BAR.NORMAL

        return (
          <div
            key={toast.toastId}
            className={`
              pointer-events-auto w-80 rounded-2xl border shadow-2xl backdrop-blur-2xl overflow-hidden
              ${priorityStyle}
              ${toast.exiting ? "animate-slide-out-right" : "animate-slide-in-right"}
            `}
          >
            {/* Priority bar */}
            <div className={`h-0.5 w-full ${barColor}`} />
            
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  toast.priority === "URGENT" ? "bg-red-500/15" :
                  toast.priority === "HIGH" ? "bg-amber-500/15" : "bg-white/[0.06]"
                }`}>
                  <Icon className={`h-4 w-4 ${
                    toast.priority === "URGENT" ? "text-red-400" :
                    toast.priority === "HIGH" ? "text-amber-400" : "text-white/60"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">{toast.title}</p>
                  <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{toast.message}</p>
                  {toast.action_url && toast.action_label && (
                    <Link
                      href={toast.action_url}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {toast.action_label} →
                    </Link>
                  )}
                  <p className="text-[10px] text-white/30 mt-1.5">{timeAgo(toast.created_at)}</p>
                </div>
                <button
                  onClick={() => dismissToast(toast.toastId)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-white/[0.08] transition-colors text-white/30 hover:text-white/60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
