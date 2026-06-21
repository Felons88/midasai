"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  read_at: string | null
  priority: string
  action_url: string | null
  action_label: string | null
  icon_name: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

interface ToastNotification extends AppNotification {
  toastId: string
  exiting: boolean
}

interface NotificationContextValue {
  notifications: AppNotification[]
  toasts: ToastNotification[]
  unreadCount: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  dismissToast: (toastId: string) => void
  loading: boolean
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  toasts: [],
  unreadCount: 0,
  markRead: async () => {},
  markAllRead: async () => {},
  dismissToast: () => {},
  loading: true,
})

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children, userId }: { children: React.ReactNode; userId: string | null }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()
  const toastTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const unreadCount = notifications.filter(n => !n.read).length

  const addToast = useCallback((n: AppNotification) => {
    const toastId = `toast_${n.id}`
    setToasts(prev => [...prev, { ...n, toastId, exiting: false }])
    // Auto-dismiss after 5s
    const t = setTimeout(() => dismissToast(toastId), 5000)
    toastTimeouts.current.set(toastId, t)
  }, [])

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.map(t => t.toastId === toastId ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 350)
    const t = toastTimeouts.current.get(toastId)
    if (t) { clearTimeout(t); toastTimeouts.current.delete(toastId) }
  }, [])

  // Initial load
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
      setNotifications((data as AppNotification[]) || [])
      setLoading(false)
    }
    load()
  }, [userId])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, payload => {
        const n = payload.new as AppNotification
        setNotifications(prev => [n, ...prev])
        // Only toast for NORMAL+ priority
        if (n.priority === "NORMAL" || n.priority === "HIGH" || n.priority === "URGENT") {
          addToast(n)
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, payload => {
        const updated = payload.new as AppNotification
        setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
    await supabase.from("notifications").update({ read: true, read_at: new Date().toISOString() }).eq("id", id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })))
    await supabase.rpc("mark_all_notifications_read", { p_user_id: userId })
  }, [userId])

  return (
    <NotificationContext.Provider value={{ notifications, toasts, unreadCount, markRead, markAllRead, dismissToast, loading }}>
      {children}
    </NotificationContext.Provider>
  )
}
