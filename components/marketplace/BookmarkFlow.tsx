"use client"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, CheckCircle } from "lucide-react"

interface BookmarkFlowProps {
  listingId: string
  listingTitle: string
  isBookmarked?: boolean
  onBookmarkChange?: (bookmarked: boolean) => void
}

export function BookmarkFlow({
  listingId,
  listingTitle,
  isBookmarked: initialBookmarked = false,
  onBookmarkChange,
}: BookmarkFlowProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const [supabase] = useState(() => createBrowserSupabaseClient())

  const handleBookmark = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Store current URL for redirect after login
        const currentPath = window.location.pathname
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      if (bookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId)

        if (!error) {
          setBookmarked(false)
          onBookmarkChange?.(false)
        }
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            listing_id: listingId,
            created_at: new Date().toISOString()
          })

        if (!error) {
          setBookmarked(true)
          onBookmarkChange?.(true)
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        }
      }
    } catch (err) {
      console.error('Bookmark error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant={bookmarked ? "secondary" : "outline"}
        size="sm"
        onClick={handleBookmark}
        disabled={loading}
        className="gap-2"
      >
        {bookmarked ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {bookmarked ? "Saved" : "Bookmark"}
      </Button>

      {/* Success notification */}
      {showSuccess && (
        <div className="absolute top-full mt-2 right-0 bg-surface border border-white/10 rounded-lg shadow-lg p-3 min-w-[200px] z-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Saved to bookmarks!</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="absolute top-full mt-2 right-0 bg-surface border border-white/10 rounded-lg shadow-lg p-3 min-w-[150px] z-50">
          <span className="text-sm text-text-tertiary">Processing...</span>
        </div>
      )}
    </div>
  )
}
