"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MarkdownContent } from "@/components/marketplace/listing/MarkdownContent"

interface ListingDocsEditorProps {
  listingId: string
  initialReadme: string | null
  githubUrl?: string | null
}

export function ListingDocsEditor({
  listingId,
  initialReadme,
  githubUrl,
}: ListingDocsEditorProps) {
  const [readme, setReadme] = useState(initialReadme ?? "")
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/listings/${listingId}/readme`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readme: readme.trim() || null }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to save documentation.")
      return
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-text-primary">Documentation</CardTitle>
        <p className="text-sm text-text-secondary">
          Markdown supported. Shown on the listing Documentation tab.
          {githubUrl && (
            <>
              {" "}
              Source repo:{" "}
              <a href={githubUrl} target="_blank" rel="noreferrer" className="text-cta hover:underline">
                GitHub
              </a>
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={preview ? "outline" : "default"}
            size="sm"
            onClick={() => setPreview(false)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant={preview ? "default" : "outline"}
            size="sm"
            onClick={() => setPreview(true)}
          >
            Preview
          </Button>
        </div>

        {preview ? (
          <div className="rounded-xl border border-white/10 bg-[#0a0a0f] p-4 min-h-[200px]">
            {readme ? (
              <MarkdownContent content={readme} />
            ) : (
              <p className="text-sm text-text-tertiary">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <Textarea
            value={readme}
            onChange={(e) => setReadme(e.target.value)}
            rows={16}
            placeholder="# Getting started&#10;&#10;Describe how to use your listing…"
            className="bg-surface border-white/10 font-mono text-sm"
          />
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">Documentation saved.</p>}

        <Button onClick={save} disabled={saving} className="bg-cta text-black hover:bg-cta/90">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Save documentation"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
