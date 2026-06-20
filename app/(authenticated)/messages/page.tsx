import { MessageSquare } from "lucide-react"

export default function MessagesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Messages</h1>
        <p className="text-white/50 text-sm">Conversations with creators and support</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageSquare className="h-12 w-12 text-white/10 mb-4" />
        <p className="text-white/50 mb-2">No messages yet</p>
        <p className="text-white/30 text-sm">Messages from creators and support will appear here</p>
      </div>
    </div>
  )
}
