"use client"

import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MessageCreatorButtonProps {
  creatorId: string
  creatorName?: string | null
  listingTitle?: string
  listingId?: string
  currentUserId?: string | null
}

export function MessageCreatorButton({
  creatorId,
  creatorName,
  listingTitle,
  listingId,
  currentUserId,
}: MessageCreatorButtonProps) {
  const router = useRouter()

  if (currentUserId && currentUserId === creatorId) {
    return null
  }

  const handleClick = () => {
    if (!currentUserId) {
      const returnPath = listingId ? `/listing/${listingId}` : window.location.pathname
      router.push(`/auth/login?redirect=${encodeURIComponent(returnPath)}`)
      return
    }

    const params = new URLSearchParams({ to: creatorId })
    if (listingTitle) {
      params.set("subject", `About: ${listingTitle}`)
    }
    router.push(`/messages?${params.toString()}`)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full mt-4 gap-2"
      onClick={handleClick}
      data-testid="message-creator-btn"
    >
      <MessageSquare className="h-4 w-4" />
      Message {creatorName?.split(" ")[0] ?? "creator"}
    </Button>
  )
}
