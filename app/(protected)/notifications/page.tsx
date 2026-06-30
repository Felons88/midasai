import { createClient } from "@/lib/supabase/server"
import { Bell } from "lucide-react"
import { NotificationsList } from "@/components/notifications/NotificationsList"
import type { AppNotification } from "@/components/notifications/NotificationProvider"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="py-24 text-center text-white/50">
        Please log in to view your notifications.
      </div>
    )
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <Bell className="h-7 w-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-white/50">Click any notification to view the full message</p>
        </div>
      </div>
      <NotificationsList
        initialNotifications={(notifications as AppNotification[]) ?? []}
        userId={user.id}
      />
    </div>
  )
}
