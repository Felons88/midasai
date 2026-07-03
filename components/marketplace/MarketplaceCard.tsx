"use client"

import Link from "next/link"
import { Download, Star, BadgeCheck, Clock, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { truncateText } from "@/lib/listings/normalize"
import { trackEvent } from "@/lib/analytics"
import { useState } from "react"
import { InstallModal } from "./InstallModal"
import type { ReactNode } from "react"

export type MarketplaceCardData = {
  id: string
  title: string
  seo_title?: string | null
  description?: string | null
  short_description?: string | null
  type?: string | null
  price?: number | null
  downloads?: number | null
  views?: number | null
  average_rating?: number | null
  review_count?: number | null
  images?: string[] | null
  updated_at?: string | null
  creator?: { name?: string | null; avatar_url?: string | null; verified?: boolean | null } | null
  featured?: boolean | null
  verified?: boolean | null
  github_url?: string | null
  install_commands?: { platform: string; command: string; description?: string | null }[]
}

type MarketplaceCardProps = {
  listing: MarketplaceCardData
  index?: number
  showPrice?: boolean
  action?: ReactNode
}

export function MarketplaceCard({
  listing,
  index = 0,
  showPrice = true,
  action,
}: MarketplaceCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const type = (listing.type ?? "SKILL").toUpperCase()
  const price = listing.price ?? 0
  const downloads = listing.downloads ?? 0
  const rating = listing.average_rating ?? 0
  const reviewCount = listing.review_count ?? 0
  const updatedAt = listing.updated_at ? new Date(listing.updated_at) : null
  const creator = listing.creator

  const isNew =
    listing.updated_at &&
    Date.now() - new Date(listing.updated_at).getTime() < 1000 * 60 * 60 * 24 * 7

  return (
    <>
      <Link
        href={`/listing/${listing.id}`}
        className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta rounded-xl"
        aria-label={`${listing.title} by ${creator?.name ?? "MidasAI"}`}
        onClick={() =>
          trackEvent("listing_clicked", {
            listing_id: listing.id,
            type: listing.type ?? "SKILL",
            position: index,
          })
        }
      >
        <Card
          className={cn(
            "glass hover:shadow-glow transition-smooth overflow-hidden",
            listing.featured && "ring-1 ring-cta/30"
          )}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <CardHeader className="space-y-2 p-4 pb-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                  {type.replace(/_/g, " ")}
                </Badge>
                {listing.featured && (
                  <Badge className="bg-cta text-primary-foreground text-[10px] uppercase tracking-wider">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {isNew && (
                  <Badge variant="outline" className="text-blue-400 border-blue-500/30 text-[10px]">
                    New
                  </Badge>
                )}
              </div>
              {showPrice && (
                <span className={cn(
                  "text-xs font-semibold shrink-0",
                  price > 0 ? "text-cta" : "text-emerald-400"
                )}>
                  {price > 0 ? `$${price}` : "Free"}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-text-primary line-clamp-2 group-hover:text-cta transition-smooth leading-snug">
              {listing.seo_title || listing.title}
            </h3>
            {(listing.short_description || listing.description) && (
              <p className="text-sm text-text-secondary line-clamp-2">
                {listing.short_description || truncateText(listing.description ?? "")}
              </p>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-3">
            {creator && (
              <div className="flex items-center gap-1.5 mb-3">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-surface border border-white/10" />
                )}
                <span className="text-xs text-text-tertiary truncate">{creator.name ?? "Creator"}</span>
                {creator.verified && <BadgeCheck className="h-3 w-3 text-emerald-400 shrink-0" />}
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {downloads.toLocaleString()}
                </span>
                {rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {updatedAt && (
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(updatedAt)}
                  </span>
                )}
              </div>
              {action ? (
                <div onClick={(e) => e.preventDefault()}>{action}</div>
              ) : (
                <Button
                  size="sm"
                  className="text-xs h-7 px-3 shrink-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setModalOpen(true)
                  }}
                >
                  Install
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
      <InstallModal
        listing={listing}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years}y ago`
  if (months > 0) return `${months}mo ago`
  if (weeks > 0) return `${weeks}w ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

export function MarketplaceCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-xl overflow-hidden animate-pulse", className)}>
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-surface rounded w-1/3" />
          <div className="h-4 bg-surface rounded w-10" />
        </div>
        <div className="h-5 bg-surface rounded w-3/4" />
        <div className="h-4 bg-surface rounded w-full" />
        <div className="h-4 bg-surface rounded w-2/3" />
        <div className="pt-3 flex justify-between items-center">
          <div className="h-3 bg-surface rounded w-1/4" />
          <div className="h-7 bg-surface rounded w-16" />
        </div>
      </div>
    </div>
  )
}

export function MarketplaceCardGrid({
  listings,
  empty,
  className,
}: {
  listings: MarketplaceCardData[]
  empty?: ReactNode
  className?: string
}) {
  if (listings.length === 0) {
    return <>{empty}</>
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}
    >
      {listings.map((listing, index) => (
        <MarketplaceCard key={listing.id} listing={listing} index={index} />
      ))}
    </div>
  )
}

export function MarketplaceCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MarketplaceCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function MarketplaceEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-12 animate-fade-in-up">
      <div className="mx-auto w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4">
        <Sparkles className="h-5 w-5 text-text-tertiary" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-md mx-auto">{description}</p>
    </div>
  )
}
