'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FollowButtonProps {
  creatorId: string
  isAuthenticated: boolean
  initialIsFollowing: boolean
}

export function FollowButton({
  creatorId,
  isAuthenticated,
  initialIsFollowing,
}: FollowButtonProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isAuthenticated) {
    return (
      <Button variant="default" asChild>
        <Link href={`/auth/login?redirect=/creators/${creatorId}`}>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </Link>
      </Button>
    )
  }

  const toggleFollow = async () => {
    setError('')
    setLoading(true)
    const next = !isFollowing
    // Optimistic update.
    setIsFollowing(next)

    try {
      const res = next
        ? await fetch('/api/follows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followingId: creatorId }),
          })
        : await fetch(`/api/follows?followingId=${creatorId}`, {
            method: 'DELETE',
          })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Request failed')
      }

      // Re-sync server-rendered stats (e.g. follower count in the header).
      router.refresh()
    } catch (err: any) {
      // Revert optimistic update on failure.
      setIsFollowing(!next)
      setError(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        onClick={toggleFollow}
        disabled={loading}
        variant={isFollowing ? 'outline' : 'default'}
        aria-pressed={isFollowing}
      >
        {isFollowing ? (
          <>
            <UserCheck className="h-4 w-4 mr-2" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Follow
          </>
        )}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
