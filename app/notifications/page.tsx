import { Card, CardContent } from "@/components/ui/card"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: "New listing approved",
      message: "Your listing 'AI Tool 1' has been approved and is now live",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      title: "Purchase received",
      message: "Someone purchased your 'Claude Skill Pack'",
      time: "1 day ago",
      read: false,
    },
    {
      id: 3,
      title: "Welcome to MidasAI",
      message: "Thank you for joining our community",
      time: "3 days ago",
      read: true,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your account activity</p>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={!notification.read ? "border-primary" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${notification.read ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{notification.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <Button variant="ghost" size="sm">
                      <Check className="h-4 w-4 mr-2" />
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
