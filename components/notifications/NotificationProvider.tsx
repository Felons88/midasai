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
  selectedNotification: AppNotification | null
  openNotification: (n: AppNotification) => void
  closeNotification: () => void
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  dismissToast: (toastId: string) => void
  loading: boolean
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  toasts: [],
  unreadCount: 0,
  selectedNotification: null,
  openNotification: () => {},
  closeNotification: () => {},
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
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserSupabaseClient()
  const toastTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const initialToastDone = useRef(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const shouldToast = useCallback((n: AppNotification) => {
    const p = (n.priority ?? "NORMAL").toUpperCase()
    return p === "NORMAL" || p === "HIGH" || p === "URGENT"
  }, [])

  const openNotification = useCallback((n: AppNotification) => {
    setSelectedNotification(n)
  }, [])

  const closeNotification = useCallback(() => {
    setSelectedNotification(null)
  }, [])

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.map(t => t.toastId === toastId ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 350)
    const t = toastTimeouts.current.get(toastId)
    if (t) { clearTimeout(t); toastTimeouts.current.delete(toastId) }
  }, [])

  const addToast = useCallback((n: AppNotification) => {
    const toastId = `toast_${n.id}`
    setToasts(prev => {
      if (prev.some(t => t.id === n.id)) return prev
      return [...prev, { ...n, toastId, exiting: false }]
    })
    const t = setTimeout(() => dismissToast(toastId), 8000)
    toastTimeouts.current.set(toastId, t)
  }, [dismissToast])

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
      const rows = (data as AppNotification[]) || []
      setNotifications(rows)
      setLoading(false)

      if (!initialToastDone.current) {
        initialToastDone.current = true
        const recentUnread = rows.filter(n => !n.read && shouldToast(n)).slice(0, 3)
        for (const n of recentUnread) {
          addToast(n)
        }
      }
    }
    load()
  }, [userId, shouldToast, addToast])

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
        if (shouldToast(n)) {
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
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        unreadCount,
        selectedNotification,
        openNotification,
        closeNotification,
        markRead,
        markAllRead,
        dismissToast,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
