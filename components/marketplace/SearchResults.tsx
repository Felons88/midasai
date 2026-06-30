"use client"

import { useState } from "react"
import { MarketplaceCard, MarketplaceCardData } from "./MarketplaceCard"
import { MarketplaceEmptyState } from "./MarketplaceCard"
import { InfiniteScroll } from "@/components/ui/infinite-scroll"

interface SearchResultsProps {
  initialListings: MarketplaceCardData[]
  total: number
  query?: string
  category?: string
  sort?: string
  type?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
}

export function SearchResults({
  initialListings,
  total,
  query,
  category,
  sort,
  type,
  minPrice,
  maxPrice,
  minRating,
}: SearchResultsProps) {
  const [listings, setListings] = useState<MarketplaceCardData[]>(initialListings)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialListings.length < total)

  const loadMore = async () => {
    if (isLoading) return
    setIsLoading(true)

    const nextPage = page + 1
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category) params.set("category", category)
    if (type) params.set("type", type)
    if (sort) params.set("sort", sort)
    if (minPrice !== undefined) params.set("minPrice", String(minPrice))
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice))
    if (minRating !== undefined) params.set("minRating", String(minRating))
    params.set("page", String(nextPage))
    params.set("limit", "20")

    try {
      const res = await fetch(`/api/search?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setListings((prev) => [...prev, ...data.listings])
        setPage(nextPage)
        setHasMore(data.listings.length > 0 && listings.length + data.listings.length < total)
      }
    } catch (error) {
      console.error("Failed to load more listings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (listings.length === 0) {
    return (
      <MarketplaceEmptyState
        title="No results found"
        description={
          query
            ? `We couldn't find anything matching "${query}". Try a different term or broaden your filters.`
            : "No listings match the selected filters. Try clearing some filters to see more results."
        }
      />
    )
  }

  return (
    <>
      <InfiniteScroll
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={loadMore}
        threshold={200}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {listings.map((listing, index) => (
            <MarketplaceCard key={listing.id} listing={listing} index={index} />
          ))}
        </div>
      </InfiniteScroll>
      <div className="mt-4 text-center text-sm text-text-tertiary">
        Showing {listings.length} of {total} listings
      </div>
    </>
  )
}
