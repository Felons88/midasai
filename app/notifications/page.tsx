export const dynamic = 'force-dynamic'
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getUserNotifications(userId: string) {
  try {
    const supabase = await createClient()
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
      return []
    }

    return notifications || []
  } catch (error) {
    console.error('Error in getUserNotifications:', error)
    return []
  }
}

function formatTimeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative text-center">
          <Bell className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4 text-text-primary">Notifications</h1>
          <p className="text-xl text-text-secondary mb-8">Sign in to view your notifications.</p>
          <Button asChild className="shadow-glow">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  const notifications = await getUserNotifications(user.id)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Notifications</h1>
            <p className="text-xl text-text-secondary">Stay updated with your account activity</p>
          </div>

          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {notifications.map((notification: { id: string; title: string; message: string; read: boolean; created_at: string }) => (
              <Card key={notification.id} className={`glass transition-smooth ${!notification.read ? 'border-cta/30' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${notification.read ? 'bg-surface' : 'bg-cta/10'}`}>
                      <Bell className={`h-4 w-4 ${notification.read ? 'text-text-tertiary' : 'text-cta'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-text-primary">{notification.title}</h3>
                      <p className="text-text-secondary text-sm mb-2">{notification.message}</p>
                      <p className="text-xs text-text-tertiary">{formatTimeAgo(notification.created_at)}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-cta shrink-0 mt-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-24 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Bell className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-xl text-text-secondary">No notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
