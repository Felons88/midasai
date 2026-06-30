"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, MessageSquare } from "lucide-react"

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  users: { name: string | null; avatar_url: string | null } | null
  review_responses: { id: string; response: string; updated_at: string }[] | null
}

interface ReviewResponseManagerProps {
  listingId: string
  creatorId: string
  initialReviews: ReviewRow[]
}

export function ReviewResponseManager({
  listingId,
  creatorId,
  initialReviews,
}: ReviewResponseManagerProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialReviews.map((review) => [
        review.id,
        review.review_responses?.[0]?.response ?? "",
      ])
    )
  )
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function saveResponse(reviewId: string) {
    const response = drafts[reviewId]?.trim()
    if (!response) {
      setError("Response cannot be empty.")
      return
    }

    setSavingId(reviewId)
    setError(null)
    const supabase = createClient()
    const existing = reviews.find((r) => r.id === reviewId)?.review_responses?.[0]

    const { data, error: saveError } = existing
      ? await supabase
          .from("review_responses")
          .update({ response, updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select("id, response, updated_at")
          .single()
      : await supabase
          .from("review_responses")
          .insert({ review_id: reviewId, creator_id: creatorId, response })
          .select("id, response, updated_at")
          .single()

    setSavingId(null)

    if (saveError || !data) {
      setError(saveError?.message ?? "Failed to save response.")
      return
    }

    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? { ...review, review_responses: [data] }
          : review
      )
    )
  }

  if (reviews.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="py-12 text-center text-text-secondary">
          No reviews yet for this listing.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      {reviews.map((review) => (
        <Card key={review.id} className="glass">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-primary font-medium">
                  {review.users?.name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <CardTitle className="text-base text-text-primary">
                    {review.users?.name ?? "Anonymous"}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating ? "fill-cta text-cta" : "text-text-tertiary"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-text-tertiary">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <MessageSquare className="h-5 w-5 text-text-tertiary shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {review.comment && (
              <p className="text-sm text-text-secondary border-l-2 border-white/10 pl-4">
                {review.comment}
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Your response</label>
              <Textarea
                value={drafts[review.id] ?? ""}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                }
                placeholder="Thank the reviewer or address their feedback..."
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              {review.review_responses?.[0]?.updated_at && (
                <span className="text-xs text-text-tertiary">
                  Last saved {new Date(review.review_responses[0].updated_at).toLocaleString()}
                </span>
              )}
              <Button
                size="sm"
                onClick={() => saveResponse(review.id)}
                disabled={savingId === review.id}
              >
                {savingId === review.id ? "Saving..." : "Save response"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
