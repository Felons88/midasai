"use client"

import { useState } from "react"
import { X, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ListingTagManagerProps {
  listingId: string
  initialTags: string[]
}

export function ListingTagManager({ listingId, initialTags }: ListingTagManagerProps) {
  const [tags, setTags] = useState(initialTags)
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function addTag() {
    const value = input.trim()
    if (!value) return
    if (tags.length >= 20) {
      setError("Maximum 20 tags per listing.")
      return
    }
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setInput("")
      return
    }
    setTags((prev) => [...prev, value])
    setInput("")
    setError(null)
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  async function saveTags() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/listings/${listingId}/tags`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to save tags.")
      return
    }

    const data = await res.json()
    setTags(data.tags ?? tags)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-text-primary">Listing tags</CardTitle>
        <p className="text-sm text-text-secondary">
          Tags power marketplace search and discovery. Use specific keywords buyers might search for.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {tags.length === 0 ? (
            <p className="text-sm text-text-tertiary">No tags yet.</p>
          ) : (
            tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-surface border border-white/10 px-3 py-1 text-xs text-text-secondary"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-text-tertiary hover:text-red-400 transition-smooth"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Add a tag…"
            className="bg-surface border-white/10"
          />
          <Button type="button" variant="outline" onClick={addTag} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">Tags saved.</p>}

        <Button onClick={saveTags} disabled={saving} className="bg-cta text-black hover:bg-cta/90">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Save tags"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
