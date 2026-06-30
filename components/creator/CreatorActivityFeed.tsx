import Link from "next/link"
import { Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ActivityItem = {
  id: string
  event_type: string
  entity_type: string | null
  entity_id: string | null
  entity_title: string | null
  created_at: string | null
}

const EVENT_LABELS: Record<string, string> = {
  listing_created: "Published a listing",
  creator_followed: "Gained a new follower",
  review_received: "Received a review",
  purchase_completed: "Made a sale",
}

function activityHref(item: ActivityItem): string | null {
  if (item.entity_type === "listing" && item.entity_id) {
    return `/listing/${item.entity_id}`
  }
  return null
}

interface CreatorActivityFeedProps {
  items: ActivityItem[]
}

export function CreatorActivityFeed({ items }: CreatorActivityFeedProps) {
  if (items.length === 0) return null

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center gap-2">
          <Activity className="h-5 w-5 text-cta" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const label = EVENT_LABELS[item.event_type] ?? item.event_type.replace(/_/g, " ")
          const href = activityHref(item)
          const row = (
            <div className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm text-text-primary">{label}</p>
                {item.entity_title && (
                  <p className="text-xs text-text-tertiary mt-0.5">{item.entity_title}</p>
                )}
              </div>
              <time className="text-xs text-text-tertiary shrink-0">
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </time>
            </div>
          )

          return href ? (
            <Link key={item.id} href={href} className="block hover:opacity-90 transition-smooth">
              {row}
            </Link>
          ) : (
            <div key={item.id}>{row}</div>
          )
        })}
      </CardContent>
    </Card>
  )
}
