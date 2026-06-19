'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, SlidersHorizontal, Star, Download, TrendingUp, Clock, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchResultCard } from './search-result-card'
import type { SearchResponse, ListingType, SortOption } from '@/lib/search/types'
import { LISTING_TYPE_LABELS, PLATFORM_OPTIONS } from '@/lib/search/types'

interface SearchContainerProps {
  initialQuery: string
  searchParams: { [key: string]: string | string[] | undefined }
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'relevance', label: 'Relevance', icon: <Search className="h-3.5 w-3.5" /> },
  { value: 'trending', label: 'Trending', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: 'newest', label: 'Newest', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'popular', label: 'Most Popular', icon: <Download className="h-3.5 w-3.5" /> },
  { value: 'rating', label: 'Top Rated', icon: <Star className="h-3.5 w-3.5" /> },
  { value: 'price_asc', label: 'Price: Low to High', icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  { value: 'price_desc', label: 'Price: High to Low', icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
]

export function SearchContainer({ initialQuery }: SearchContainerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeType, setActiveType] = useState<ListingType | ''>('')
  const [activePlatform, setActivePlatform] = useState('')
  const [activeSort, setActiveSort] = useState<SortOption>('relevance')

  // Initialize from URL params
  useEffect(() => {
    const type = searchParams.get('type') as ListingType | null
    const platform = searchParams.get('platform')
    const sort = searchParams.get('sort') as SortOption | null
    if (type) setActiveType(type)
    if (platform) setActivePlatform(platform)
    if (sort) setActiveSort(sort)
  }, [searchParams])

  const performSearch = useCallback(async (searchQuery: string, type?: string, platform?: string, sort?: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (type) params.set('type', type)
      if (platform) params.set('platform', platform)
      if (sort) params.set('sort', sort)

      const response = await fetch(`/api/search?${params.toString()}`)
      const data: SearchResponse = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Run search on mount and param changes
  useEffect(() => {
    performSearch(query, activeType, activePlatform, activeSort)
  }, [performSearch, query, activeType, activePlatform, activeSort])

  const updateURL = useCallback((params: Record<string, string>) => {
    startTransition(() => {
      const url = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.set(key, value)
      })
      router.push(`/search?${url.toString()}`, { scroll: false })
    })
  }, [router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL({ q: query, type: activeType, platform: activePlatform, sort: activeSort })
  }

  const handleTypeFilter = (type: ListingType | '') => {
    setActiveType(type)
    updateURL({ q: query, type, platform: activePlatform, sort: activeSort })
  }

  const handlePlatformFilter = (platform: string) => {
    setActivePlatform(platform === activePlatform ? '' : platform)
    updateURL({ q: query, type: activeType, platform: platform === activePlatform ? '' : platform, sort: activeSort })
  }

  const handleSortChange = (sort: SortOption) => {
    setActiveSort(sort)
    updateURL({ q: query, type: activeType, platform: activePlatform, sort })
  }

  const clearFilters = () => {
    setActiveType('')
    setActivePlatform('')
    setActiveSort('relevance')
    setQuery('')
    updateURL({})
  }

  const hasActiveFilters = activeType || activePlatform || activeSort !== 'relevance'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Search
          </h1>
          <p className="text-muted-foreground">
            Find Claude Skills, MCP Servers, AI Agents, and more
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills, plugins, agents, workflows..."
              className="h-14 pl-12 pr-24 text-lg rounded-xl border-border/60 bg-card/50 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => { setQuery(''); updateURL({ type: activeType, platform: activePlatform, sort: activeSort }) }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${showFilters ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">⌘K</kbd>
            <span>to search from anywhere</span>
          </div>
        </form>

        {/* Type Filters */}
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeType === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTypeFilter('')}
              className="rounded-full text-xs"
            >
              All
            </Button>
            {(Object.entries(LISTING_TYPE_LABELS) as [ListingType, string][]).map(([type, label]) => (
              <Button
                key={type}
                variant={activeType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeFilter(type)}
                className="rounded-full text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm space-y-4">
            {/* Platform Filter */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Platform</h3>
              <div className="flex gap-2 flex-wrap">
                {PLATFORM_OPTIONS.map((platform) => (
                  <Button
                    key={platform}
                    variant={activePlatform === platform ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePlatformFilter(platform)}
                    className="rounded-full text-xs"
                  >
                    {platform}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Sort by</h3>
              <div className="flex gap-2 flex-wrap">
                {SORT_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={activeSort === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSortChange(option.value)}
                    className="rounded-full text-xs gap-1.5"
                  >
                    {option.icon}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              'Searching...'
            ) : results ? (
              <>
                <span className="font-medium text-foreground">{results.total}</span>{' '}
                {results.total === 1 ? 'result' : 'results'}
                {query && (
                  <>
                    {' '}for &ldquo;<span className="text-foreground">{query}</span>&rdquo;
                  </>
                )}
              </>
            ) : null}
          </p>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 bg-muted/30 rounded-xl animate-pulse border border-border/40" />
            ))}
          </div>
        ) : results && results.results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.results.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : results && results.results.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Try adjusting your search terms or filters to find what you&apos;re looking for.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                Clear filters
              </Button>
            )}
          </div>
        ) : null}

        {/* Pagination */}
        {results && results.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={results.page <= 1}
              onClick={() => {
                const params = new URLSearchParams(window.location.search)
                params.set('page', String(results.page - 1))
                router.push(`/search?${params.toString()}`)
              }}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {results.page} of {results.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={results.page >= results.totalPages}
              onClick={() => {
                const params = new URLSearchParams(window.location.search)
                params.set('page', String(results.page + 1))
                router.push(`/search?${params.toString()}`)
              }}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
