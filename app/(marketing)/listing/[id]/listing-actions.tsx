'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck, Share2, Download, ShoppingCart, ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ListingActionsProps {
  listingId: string
  title: string
  price: number
  creatorId: string
  githubUrl: string | null
  isAuthenticated: boolean
  initialBookmarked: boolean
}

export function ListingActions({
  listingId,
  title,
  price,
  creatorId,
  githubUrl,
  isAuthenticated,
  initialBookmarked,
}: ListingActionsProps) {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [bmLoading, setBmLoading] = useState(false)
  const [buying, setBuying] = useState(false)
  const [shared, setShared] = useState(false)
  const [error, setError] = useState('')

  const requireAuth = () => {
    router.push(`/auth/login?redirect=/listing/${listingId}`)
  }

  const toggleBookmark = async () => {
    if (!isAuthenticated) return requireAuth()
    setError('')
    setBmLoading(true)
    const next = !bookmarked
    setBookmarked(next)
    try {
      const res = next
        ? await fetch('/api/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingId }),
          })
        : await fetch(`/api/bookmarks?listingId=${listingId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Failed')
      }
      router.refresh()
    } catch (e: any) {
      setBookmarked(!next)
      setError(e?.message || 'Could not update saved state')
    } finally {
      setBmLoading(false)
    }
  }

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      /* user cancelled or clipboard blocked */
    }
  }

  const purchase = async () => {
    if (!isAuthenticated) return requireAuth()
    setError('')
    setBuying(true)
    try {
      const res = await fetch('/api/stripe/checkout/listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          listingTitle: title,
          listingPrice: price,
          creatorId,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data?.error || 'Unable to start checkout')
      }
    } catch (e: any) {
      setError(e?.message || 'Checkout failed')
      setBuying(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {price > 0 ? (
          <Button onClick={purchase} disabled={buying} className="flex-1 h-12 text-base shadow-glow cursor-pointer">
            <ShoppingCart className="mr-2 h-5 w-5" />
            {buying ? 'Starting checkout…' : `Purchase — $${price}`}
          </Button>
        ) : githubUrl ? (
          <Button asChild className="flex-1 h-12 text-base shadow-glow cursor-pointer">
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-5 w-5" />
              Get it free
            </a>
          </Button>
        ) : (
          <Button className="flex-1 h-12 text-base shadow-glow cursor-pointer" disabled>
            <Download className="mr-2 h-5 w-5" />
            Get it free
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={toggleBookmark}
          disabled={bmLoading}
          aria-pressed={bookmarked}
          className="h-12 px-5 cursor-pointer"
        >
          {bookmarked ? (
            <>
              <BookmarkCheck className="mr-2 h-5 w-5 text-cta" /> Saved
            </>
          ) : (
            <>
              <Bookmark className="mr-2 h-5 w-5" /> Save
            </>
          )}
        </Button>

        <Button type="button" variant="outline" onClick={share} className="h-12 px-5 cursor-pointer" aria-label="Share">
          {shared ? <Check className="h-5 w-5 text-emerald-400" /> : <Share2 className="h-5 w-5" />}
        </Button>
      </div>

      {githubUrl && price > 0 && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ExternalLink className="h-4 w-4" /> View source on GitHub
        </a>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
