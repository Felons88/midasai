'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, X, Star, SearchX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface Listing {
  id: string
  title: string
  description: string
  type: string
  price: number
  average_rating: number
  review_count: number
  downloads: number
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface InitialParams {
  query?: string; type?: string; sort?: string
  minPrice?: string; maxPrice?: string; minRating?: string; tag?: string
}

const TYPES = [
  { value: '', label: 'All' },
  { value: 'SKILL', label: 'Skills' },
  { value: 'WORKFLOW', label: 'Workflows' },
  { value: 'TEMPLATE', label: 'Templates' },
  { value: 'PLUGIN', label: 'Plugins' },
  { value: 'MCP', label: 'MCP Servers' },
  { value: 'AGENT', label: 'AI Agents' },
]

const SORTS = [
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'trending', label: 'Trending' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-smooth'

// Client-side, in-memory filtering for an instant experience with no route
// navigation (which previously triggered a full-page route loader on each
// keystroke). Suitable for the current catalog size; swap to a paginated API
// fetch if the dataset grows large.
export function MarketplaceSearch({ initialListings, initialParams }: { initialListings: Listing[]; initialParams?: InitialParams }) {
  const [query, setQuery] = useState(initialParams?.query ?? '')
  const [type, setType] = useState(initialParams?.type ?? '')
  const [sort, setSort] = useState(initialParams?.sort ?? 'downloads')
  const [minPrice, setMinPrice] = useState(initialParams?.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(initialParams?.maxPrice ?? '')
  const [minRating, setMinRating] = useState(initialParams?.minRating ?? '')
  const [tag, setTag] = useState(initialParams?.tag ?? '')

  // Keep the URL in sync (shareable) without a Next navigation/loader.
  useEffect(() => {
    const sp = new URLSearchParams()
    if (query.trim()) sp.set('query', query.trim())
    if (type) sp.set('type', type)
    if (sort && sort !== 'downloads') sp.set('sort', sort)
    if (minPrice) sp.set('minPrice', minPrice)
    if (maxPrice) sp.set('maxPrice', maxPrice)
    if (minRating) sp.set('minRating', minRating)
    if (tag) sp.set('tag', tag)
    const qs = sp.toString()
    const t = setTimeout(() => {
      window.history.replaceState(null, '', qs ? `/search?${qs}` : '/search')
    }, 250)
    return () => clearTimeout(t)
  }, [query, type, sort, minPrice, maxPrice, minRating, tag])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const min = minPrice ? parseFloat(minPrice) : null
    const max = maxPrice ? parseFloat(maxPrice) : null
    const minR = minRating ? parseFloat(minRating) : null

    let list = initialListings.filter((l) => {
      if (type && l.type !== type) return false
      if (tag && !(l.tags || []).includes(tag)) return false
      if (min != null && Number(l.price) < min) return false
      if (max != null && Number(l.price) > max) return false
      if (minR != null && Number(l.average_rating || 0) < minR) return false
      if (q) {
        const hay = `${l.title} ${l.description} ${(l.tags || []).join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    const num = (v: any) => Number(v || 0)
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'price-low': return num(a.price) - num(b.price)
        case 'price-high': return num(b.price) - num(a.price)
        case 'newest': return +new Date(b.created_at) - +new Date(a.created_at)
        case 'updated': return +new Date(b.updated_at) - +new Date(a.updated_at)
        case 'rating': return num(b.average_rating) - num(a.average_rating)
        case 'reviews': return num(b.review_count) - num(a.review_count)
        default: return num(b.downloads) - num(a.downloads)
      }
    })
    return list
  }, [initialListings, query, type, sort, minPrice, maxPrice, minRating, tag])

  return (
    <div>
      <div className="space-y-5 mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the marketplace"
            placeholder="Search for skills, plugins, agents..."
            className={`${inputClass} h-14 pl-12 pr-4 text-lg`}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t.value || 'all'}
              type="button"
              onClick={() => setType(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                type === t.value
                  ? 'bg-cta text-black border-cta'
                  : 'bg-white/[0.03] text-text-secondary border-white/[0.08] hover:text-text-primary hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-text-tertiary">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-cta cursor-pointer">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-text-tertiary">Rating</span>
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-cta cursor-pointer">
              <option value="">Any</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
            </select>
          </label>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-tertiary">Price</span>
            <input type="number" min="0" inputMode="decimal" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className={`${inputClass} w-24 h-9 py-1.5`} />
            <span className="text-text-tertiary">–</span>
            <input type="number" min="0" inputMode="decimal" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className={`${inputClass} w-24 h-9 py-1.5`} />
          </div>
          {tag && (
            <button type="button" onClick={() => setTag('')} className="inline-flex items-center gap-1.5 text-sm bg-cta/10 text-cta px-3 py-1 rounded-full hover:bg-cta/20 transition-colors cursor-pointer">
              #{tag} <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-text-tertiary">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-24">
          <SearchX className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-xl text-text-secondary mb-2">No listings match your filters</p>
          <p className="text-text-tertiary">Try a different search term, type, or price range.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((l) => (
            <Card key={l.id} className="glass hover:shadow-glow transition-smooth group flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-cta bg-cta/10 px-2 py-0.5 rounded">{l.type}</span>
                  {l.average_rating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-text-secondary">
                      <Star className="h-3.5 w-3.5 fill-cta text-cta" />{Number(l.average_rating).toFixed(1)}
                      <span className="text-text-tertiary">({l.review_count})</span>
                    </span>
                  )}
                </div>
                <Link href={`/listing/${l.id}`} className="block">
                  <h3 className="text-lg font-semibold text-text-primary mb-1 line-clamp-1 group-hover:text-cta transition-colors">{l.title}</h3>
                </Link>
                <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">{l.description}</p>
                {Array.isArray(l.tags) && l.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {l.tags.slice(0, 3).map((t) => (
                      <button key={t} type="button" onClick={() => setTag(t)} className="text-xs bg-white/[0.06] text-text-secondary px-2 py-0.5 rounded hover:text-text-primary transition-colors cursor-pointer">#{t}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-text-primary">{l.price > 0 ? `$${l.price}` : 'Free'}</span>
                  <Button size="sm" className="group-hover:shadow-glow transition-smooth" asChild>
                    <Link href={`/listing/${l.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
