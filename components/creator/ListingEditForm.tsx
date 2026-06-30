"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CREATOR_STATUS_OPTIONS = ["DRAFT", "PENDING"] as const

interface ListingEditFormProps {
  listingId: string
  initialTitle: string
  initialDescription: string
  initialPrice: number
  initialStatus: string
}

export function ListingEditForm({
  listingId,
  initialTitle,
  initialDescription,
  initialPrice,
  initialStatus,
}: ListingEditFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [price, setPrice] = useState(String(initialPrice))
  const [status, setStatus] = useState(initialStatus)
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

    const safeStatus = CREATOR_STATUS_OPTIONS.includes(status as (typeof CREATOR_STATUS_OPTIONS)[number])
      ? status
      : initialStatus

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from("listings")
      .update({
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        ...(CREATOR_STATUS_OPTIONS.includes(status as (typeof CREATOR_STATUS_OPTIONS)[number])
          ? { status: safeStatus }
          : {}),
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
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-text-primary">Edit listing</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
            />
          </div>
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
          </div>
          <div>
            <Label htmlFor="status">Visibility</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {CREATOR_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "DRAFT" ? "Draft" : "Submit for review"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-tertiary mt-1">
              Only admins can publish listings to ACTIVE.
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">Listing updated successfully.</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
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
