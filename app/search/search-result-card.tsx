'use client'

import Link from 'next/link'
import { Star, Download, Eye, ArrowUpRight } from 'lucide-react'
import type { SearchResult } from '@/lib/search/types'
import { LISTING_TYPE_LABELS } from '@/lib/search/types'

interface SearchResultCardProps {
  result: SearchResult
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const href = result.slug ? `/listing/${result.slug}` : `/listing/${result.id}`

  return (
    <Link href={href} className="group block">
      <div className="relative h-full rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-5 transition-all duration-200 hover:border-primary/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
        {/* Type Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
            {LISTING_TYPE_LABELS[result.type]}
          </span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
          {result.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {result.description}
        </p>

        {/* Tags */}
        {result.tags && result.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {result.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-muted/50 text-muted-foreground border border-border/40"
              >
                {tag.name}
              </span>
            ))}
            {result.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{result.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {result.average_rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {result.average_rating.toFixed(1)}
              </span>
            )}
            {result.downloads > 0 && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {formatCount(result.downloads)}
              </span>
            )}
            {result.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatCount(result.views)}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold">
            {result.price === 0 ? (
              <span className="text-emerald-400">Free</span>
            ) : (
              `$${result.price}`
            )}
          </span>
        </div>

        {/* Creator */}
        {result.creator && (
          <div className="mt-3 flex items-center gap-2">
            {result.creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.creator.avatar_url}
                alt={result.creator.name ?? 'Creator'}
                className="h-5 w-5 rounded-full"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                {result.creator.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <span className="text-xs text-muted-foreground">{result.creator.name}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

function formatCount(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}
