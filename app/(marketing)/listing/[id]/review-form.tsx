'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, PenSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReviewFormProps {
  listingId: string
  isAuthenticated: boolean
  hasReviewed: boolean
}

export function ReviewForm({ listingId, isAuthenticated, hasReviewed }: ReviewFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (hasReviewed) {
    return <p className="text-sm text-text-tertiary">You&apos;ve already reviewed this — thanks for the feedback.</p>
  }

  if (!isAuthenticated) {
    return (
      <Button variant="outline" asChild className="cursor-pointer">
        <a href={`/auth/login?redirect=/listing/${listingId}`}>
          <PenSquare className="h-4 w-4 mr-2" />Sign in to write a review
        </a>
      </Button>
    )
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="cursor-pointer">
        <PenSquare className="h-4 w-4 mr-2" />Write a review
      </Button>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (rating < 1) return setError('Please select a star rating.')
    if (content.trim().length < 10) return setError('Review must be at least 10 characters.')

    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, rating, content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit review')
      }
      setOpen(false)
      setRating(0)
      setContent('')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-surface/40 p-4 space-y-3">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={rating === n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer p-0.5"
          >
            <Star className={`h-6 w-6 transition-colors ${n <= (hover || rating) ? 'fill-cta text-cta' : 'text-text-tertiary'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Share your experience with this listing…"
        className="w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-smooth resize-y"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 cursor-pointer">
          {loading ? 'Submitting…' : 'Submit review'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
      </div>
    </form>
  )
}
