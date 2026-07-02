"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MarketplaceCard, type MarketplaceCardData } from "@/components/marketplace/MarketplaceCard"
import { cn } from "@/lib/utils"

export function ListingCarousel({
  title,
  subtitle,
  listings,
  className,
}: {
  title: string
  subtitle?: string
  listings: MarketplaceCardData[]
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (listings.length === 0) return null

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = 340
    el.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" })
  }

  return (
    <section className={cn("py-12 relative", className)}>
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
              {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-9 h-9 rounded-full border border-white/10 bg-surface/60 flex items-center justify-center hover:border-cta/50 hover:text-cta transition-smooth"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-9 h-9 rounded-full border border-white/10 bg-surface/60 flex items-center justify-center hover:border-cta/50 hover:text-cta transition-smooth"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
          >
            {listings.map((listing, index) => (
              <div
                key={listing.id}
                className="min-w-[280px] sm:min-w-[300px] md:min-w-[320px] snap-start"
              >
                <MarketplaceCard listing={listing} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
