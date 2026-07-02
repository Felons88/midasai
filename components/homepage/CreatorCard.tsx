"use client"

import Link from "next/link"
import { BadgeCheck, Download, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export type CreatorItem = {
  id: string
  name: string | null
  slug: string | null
  avatar_url: string | null
  verified: boolean
  listingCount: number
  totalDownloads: number
  totalRating?: number
  featuredListing?: string | null
}

export function CreatorCard({ creator, index = 0 }: { creator: CreatorItem; index?: number }) {
  return (
    <Link
      href={`/creator/${creator.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-sm p-5",
        "hover:border-white/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center gap-4 mb-4">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt={creator.name || "Creator"}
            className="w-14 h-14 rounded-full object-cover border border-white/10 group-hover:border-cta/30 transition-smooth"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cta/30 to-cta/10 flex items-center justify-center border border-white/10">
            <span className="text-lg font-bold text-cta">
              {(creator.name || "M").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-text-primary truncate group-hover:text-cta transition-smooth">
              {creator.name || "Verified Creator"}
            </h3>
            {creator.verified && <BadgeCheck className="h-4 w-4 text-emerald-400 shrink-0" />}
          </div>
          <p className="text-xs text-text-tertiary">{creator.listingCount} assets</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary mb-1">
            <Download className="h-3.5 w-3.5" />
            Downloads
          </div>
          <div className="text-sm font-bold text-text-primary">
            {(creator.totalDownloads || 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary mb-1">
            <Star className="h-3.5 w-3.5" />
            Rating
          </div>
          <div className="text-sm font-bold text-text-primary">
            {creator.totalRating && creator.totalRating > 0 ? creator.totalRating.toFixed(1) : "—"}
          </div>
        </div>
      </div>

      {creator.featuredListing && (
        <div className="text-xs text-text-secondary line-clamp-1">
          <span className="text-text-tertiary">Featured:</span>{" "}
          <span className="group-hover:text-cta transition-smooth">{creator.featuredListing}</span>
        </div>
      )}
    </Link>
  )
}
