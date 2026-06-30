"use client"

import { useRef } from "react"
import { ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type ListingPhotoUploadFieldProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  suggestedUrls?: string[]
  selectedUrls?: string[]
  onSelectedUrlsChange?: (urls: string[]) => void
  disabled?: boolean
}

export function ListingPhotoUploadField({
  files,
  onFilesChange,
  suggestedUrls = [],
  selectedUrls = [],
  onSelectedUrlsChange,
  disabled,
}: ListingPhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function toggleSuggested(url: string) {
    if (!onSelectedUrlsChange) return
    if (selectedUrls.includes(url)) {
      onSelectedUrlsChange(selectedUrls.filter((u) => u !== url))
    } else {
      onSelectedUrlsChange([...selectedUrls, url].slice(0, 12))
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-white">Photos & screenshots</Label>
      <p className="text-xs text-white/50">
        Add gallery images for your listing. JPEG, PNG, WebP, or GIF up to 10MB each.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? [])
          if (picked.length) onFilesChange([...files, ...picked].slice(0, 12))
          e.target.value = ""
        }}
      />

      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="border-white/[0.2] text-white hover:bg-white/[0.1]"
      >
        <ImagePlus className="h-4 w-4 mr-2" />
        Upload photos
      </Button>

      {files.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="relative group rounded-lg overflow-hidden border border-white/10">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-24 object-cover"
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
                className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {suggestedUrls.length > 0 && onSelectedUrlsChange && (
        <div className="space-y-2">
          <p className="text-xs text-white/50">From repository (click to include)</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {suggestedUrls.map((url) => {
              const selected = selectedUrls.includes(url)
              return (
                <li key={url}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleSuggested(url)}
                    className={`relative w-full rounded-lg overflow-hidden border transition-colors ${
                      selected ? "border-amber-400 ring-2 ring-amber-400/40" : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-24 object-cover" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
