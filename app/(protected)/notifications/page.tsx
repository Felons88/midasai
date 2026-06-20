import { Card, CardContent } from "@/components/ui/card"
import { Bell } from "lucide-react"
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

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to view your notifications.</p>
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
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-8 w-8 text-cta" />
              <h1 className="text-5xl md:text-6xl font-bold text-text-primary">Notifications</h1>
            </div>
            <p className="text-xl text-text-secondary">Stay updated with your account activity</p>
          </div>

          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {notifications.map((notification: any, index: number) => (
              <Card key={notification.id} className={`glass transition-smooth ${!notification.read ? 'border-cta/30' : ''}`} style={{ animationDelay: `${index * 0.03}s` }}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full flex-shrink-0 ${notification.read ? 'bg-surface' : 'bg-cta/10'}`}>
                      <Bell className={`h-4 w-4 ${notification.read ? 'text-text-tertiary' : 'text-cta'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary mb-1">{notification.title}</h3>
                      <p className="text-text-secondary text-sm mb-2">{notification.message}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(notification.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-cta flex-shrink-0 mt-2" />
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
              <p className="text-text-tertiary mt-2">We&apos;ll notify you about important updates.</p>
              <Button className="mt-6" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
