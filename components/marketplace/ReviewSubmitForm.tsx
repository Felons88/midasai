"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { trackEvent } from "@/lib/analytics"

interface ReviewSubmitFormProps {
  listingId: string
}

export function ReviewSubmitForm({ listingId }: ReviewSubmitFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.")
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("listing_id", listingId)
        .eq("user_id", user.id)
        .maybeSingle()

      if (existing) {
        setError("You have already reviewed this listing.")
        return
      }

      const { error: insertError } = await supabase.from("reviews").insert({
        listing_id: listingId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      })

      if (insertError) {
        if (insertError.code === "23505") {
          setError("You have already reviewed this listing.")
        } else {
          setError(insertError.message)
        }
        return
      }

      setSuccess(true)
      trackEvent("review_submitted", { listing_id: listingId, rating })
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card className="glass">
        <CardContent className="p-6">
          <p className="text-sm text-cta">Thank you! Your review has been submitted.</p>
        </CardContent>
      </Card>
    )
  }

  const displayRating = hoverRating || rating

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-2xl text-text-primary">Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review-rating">Rating</Label>
            <div
              id="review-rating"
              className="flex items-center gap-1"
              role="radiogroup"
              aria-label="Rating"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="rounded p-0.5 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  aria-pressed={rating === value}
                >
                  <Star
                    className={`h-6 w-6 ${
                      value <= displayRating ? "fill-cta text-cta" : "text-text-tertiary"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-text-secondary">{rating} / 5</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">Comment (optional)</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this listing..."
              rows={4}
              maxLength={2000}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting || rating < 1} className="shadow-glow">
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
