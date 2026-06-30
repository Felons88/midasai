"use client"

import { useState } from "react"
import type { ListingMediaItem } from "@/lib/listings/media"

interface ListingMediaGalleryProps {
  media: ListingMediaItem[]
  title: string
}

export function ListingMediaGallery({ media, title }: ListingMediaGalleryProps) {
  const [activeId, setActiveId] = useState(media[0]?.id ?? "")

  if (media.length === 0) {
    return (
      <div className="aspect-video bg-surface rounded-xl flex items-center justify-center">
        <span className="text-text-tertiary text-sm">No preview available</span>
      </div>
    )
  }

  const active = media.find((m) => m.id === activeId) ?? media[0]

  return (
    <div className="space-y-3">
      <div className="aspect-video bg-surface rounded-xl overflow-hidden border border-white/5">
        {active.type === "embed" && active.embedUrl ? (
          <iframe
            src={active.embedUrl}
            title={`${title} preview`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : active.type === "video" ? (
          <video
            src={active.url}
            controls
            className="w-full h-full object-contain bg-black"
            aria-label={`${title} preview video`}
          />
        ) : (
          <img
            src={active.url}
            alt={active.label ?? title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-smooth ${
                item.id === active.id ? "border-cta" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={item.label ?? `View ${item.type}`}
            >
              {item.type === "image" ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface flex items-center justify-center text-xs text-cta">
                  {item.type === "embed" ? "Embed" : "Video"}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
