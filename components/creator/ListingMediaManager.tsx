"use client"

import { useRef, useState } from "react"
import { Loader2, Trash2, Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

type MediaEntry = {
  url: string
  type?: string
  name?: string
}

interface ListingMediaManagerProps {
  listingId: string
  initialImages: string[]
  initialFiles: MediaEntry[]
}

export function ListingMediaManager({
  listingId,
  initialImages,
  initialFiles,
}: ListingMediaManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState(initialImages)
  const [files, setFiles] = useState(initialFiles)
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function addImage() {
    const url = imageUrl.trim()
    if (!url) return
    setImages((prev) => [...prev, url])
    setImageUrl("")
  }

  function addVideo() {
    const url = videoUrl.trim()
    if (!url) return
    setFiles((prev) => [
      ...prev,
      { url, type: "video/mp4", name: "Preview video" },
    ])
    setVideoUrl("")
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`/api/listings/${listingId}/media`, {
      method: "POST",
      body: formData,
    })

    setUploading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Upload failed.")
      return
    }

    const data = await res.json()
    if (data.kind === "video") {
      setFiles((prev) => [
        ...prev,
        { url: data.url, type: data.type, name: data.name },
      ])
    } else {
      setImages((prev) => [...prev, data.url])
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/listings/${listingId}/media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images, files }),
    })

    setSaving(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Failed to save media.")
      return
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-text-primary">Gallery media</CardTitle>
        <p className="text-sm text-text-secondary">
          Upload images or videos to Supabase Storage, or paste URLs (YouTube/Vimeo supported).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-text-secondary">Upload file</Label>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void uploadFile(file)
                e.target.value = ""
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? "Uploading…" : "Choose file"}
            </Button>
            <span className="text-xs text-text-tertiary">Max 10MB · JPEG, PNG, WebP, GIF, MP4, WebM</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-text-secondary">Screenshot image URL</Label>
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="bg-surface border-white/10"
            />
            <Button type="button" variant="outline" onClick={addImage}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="space-y-2">
            {images.map((url, i) => (
              <li key={`${url}-${i}`} className="flex items-center gap-2 text-sm text-text-secondary">
                <img src={url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                <span className="truncate flex-1">{url}</span>
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-text-tertiary hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Label className="text-text-secondary">Video URL (YouTube/Vimeo or direct)</Label>
          <div className="flex gap-2">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className="bg-surface border-white/10"
            />
            <Button type="button" variant="outline" onClick={addVideo}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="space-y-2">
            {files.map((file, i) => (
              <li key={`${file.url}-${i}`} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="truncate flex-1">{file.url}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-text-tertiary hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-emerald-400">Media saved.</p>}

        <Button onClick={save} disabled={saving || uploading} className="bg-cta text-black hover:bg-cta/90">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Save gallery"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
