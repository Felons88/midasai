"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ListingPricingFormProps {
  listingId: string
  listingTitle: string
  initialPrice: number
}

export function ListingPricingForm({
  listingId,
  listingTitle,
  initialPrice,
}: ListingPricingFormProps) {
  const router = useRouter()
  const [price, setPrice] = useState(String(initialPrice))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid price.")
      setSaving(false)
      return
    }

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("listings")
      .update({
        price: parsedPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    router.refresh()
  }

  return (
    <Card className="glass max-w-lg">
      <CardHeader>
        <CardTitle className="text-text-primary">Pricing</CardTitle>
        <CardDescription className="text-text-secondary">
          Set the price for &ldquo;{listingTitle}&rdquo;
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <p className="text-xs text-text-tertiary mt-1">
              Set to 0 for a free listing.
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">Price updated successfully.</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update price"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/creator/listings">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
