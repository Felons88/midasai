"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackEvent } from "@/lib/analytics"

interface FollowCreatorButtonProps {
  creatorId: string
  creatorName?: string | null
  initialFollowing?: boolean
  currentUserId?: string | null
  followerCount?: number
}

export function FollowCreatorButton({
  creatorId,
  creatorName,
  initialFollowing = false,
  currentUserId,
  followerCount = 0,
}: FollowCreatorButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(followerCount)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (currentUserId && currentUserId === creatorId) {
    return null
  }

  const handleToggle = async () => {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setLoading(true)
    try {
      if (following) {
        const res = await fetch(`/api/follows?followingId=${creatorId}`, { method: "DELETE" })
        if (res.ok) {
          setFollowing(false)
          setCount((c) => Math.max(0, c - 1))
        }
      } else {
        const res = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: creatorId }),
        })
        if (res.ok) {
          setFollowing(true)
          setCount((c) => c + 1)
          trackEvent("creator_followed", { creator_id: creatorId })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={following ? "secondary" : "default"}
        size="sm"
        className="w-full gap-2"
        onClick={handleToggle}
        disabled={loading}
        data-testid="follow-creator-btn"
      >
        {following ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {following ? "Following" : `Follow ${creatorName?.split(" ")[0] ?? "creator"}`}
      </Button>
      <p className="text-xs text-text-tertiary text-center">
        {count} {count === 1 ? "follower" : "followers"}
      </p>
    </div>
  )
}
