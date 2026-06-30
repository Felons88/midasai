import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ComposeMessageForm } from "@/components/messages/ComposeMessageForm"
import { MarkMessagesRead } from "@/components/messages/MarkMessagesRead"

type MessageRow = {
  id: string
  content: string
  subject: string | null
  read: boolean | null
  created_at: string | null
  sender_id: string
  receiver_id: string
  sender: { id: string; name: string | null; avatar_url: string | null; email: string } | null
  receiver: { id: string; name: string | null; avatar_url: string | null; email: string } | null
}

async function getUserMessages(userId: string): Promise<MessageRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      content,
      subject,
      read,
      created_at,
      sender_id,
      receiver_id,
      sender:users!messages_sender_id_fkey(id, name, avatar_url, email),
      receiver:users!messages_receiver_id_fkey(id, name, avatar_url, email)
    `
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return (data as MessageRow[]) ?? []
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; subject?: string }>
}) {
  const { to: defaultReceiverId, subject: defaultSubject } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24">
        <p className="text-xl text-text-secondary text-center">Please log in to view messages.</p>
      </div>
    )
  }

  const messages = await getUserMessages(user.id)
  const unreadIncomingIds = messages
    .filter((m) => m.receiver_id === user.id && !m.read)
    .map((m) => m.id)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MarkMessagesRead messageIds={unreadIncomingIds} />
      <div className="ambient-glow" />
      <div className="container mx-auto px-4 py-12 relative max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-8 w-8 text-cta" />
            <h1 className="text-4xl font-bold text-text-primary">Messages</h1>
          </div>
          <p className="text-text-secondary">Conversations with creators and buyers</p>
        </div>

        <div className="mb-8">
          <ComposeMessageForm
            defaultReceiverId={defaultReceiverId}
            defaultSubject={defaultSubject}
          />
        </div>

        <div className="space-y-4">
          {messages.map((message) => {
            const isIncoming = message.receiver_id === user.id
            const other = isIncoming ? message.sender : message.receiver
            const displayName = other?.name || other?.email || "User"

            return (
              <Card
                key={message.id}
                className={`glass ${isIncoming && !message.read ? "border-cta/30" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center shrink-0">
                        {other?.avatar_url ? (
                          <img
                            src={other.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <Mail className="h-4 w-4 text-text-tertiary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary truncate">
                          {isIncoming ? `From ${displayName}` : `To ${displayName}`}
                        </p>
                        {message.subject && (
                          <p className="text-sm text-text-secondary truncate">{message.subject}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-text-tertiary shrink-0">
                      {message.created_at
                        ? new Date(message.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{message.content}</p>
                  {isIncoming && !message.read && (
                    <p className="text-xs text-cta mt-2">Unread</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {messages.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">No messages yet</p>
            <p className="text-text-tertiary text-sm mt-1">
              Send a message using the form above
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
