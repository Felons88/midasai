'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'

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

export function SearchControls() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(params.get('query') ?? '')
  const [minPrice, setMinPrice] = useState(params.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') ?? '')
  const firstRun = useRef(true)

  const type = params.get('type') ?? ''
  const sort = params.get('sort') ?? 'downloads'
  const minRating = params.get('minRating') ?? ''
  const tag = params.get('tag') ?? ''

  const update = useCallback(
    (entries: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString())
      for (const [k, v] of Object.entries(entries)) {
        if (v) sp.set(k, v)
        else sp.delete(k)
      }
      startTransition(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }))
    },
    [params, pathname, router]
  )

  // Debounce free-text and price inputs so typing feels instant without a reload per keystroke.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const t = setTimeout(() => {
      update({ query: q.trim(), minPrice, maxPrice })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, minPrice, maxPrice])

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-smooth'

  return (
    <div className="space-y-5">
      {/* Search box */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
        {isPending && <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary animate-spin" />}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search the marketplace"
          placeholder="Search for skills, plugins, agents..."
          className={`${inputClass} h-14 pl-12 pr-12 text-lg`}
        />
      </div>

      {/* Type pills */}
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            onClick={() => update({ type: t.value })}
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

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-tertiary">Sort</span>
          <select
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-cta cursor-pointer"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-tertiary">Rating</span>
          <select
            value={minRating}
            onChange={(e) => update({ minRating: e.target.value })}
            className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-cta cursor-pointer"
          >
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
      </div>

      {/* Active tag chip */}
      {tag && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-tertiary">Tag:</span>
          <button
            type="button"
            onClick={() => update({ tag: '' })}
            className="inline-flex items-center gap-1.5 text-sm bg-cta/10 text-cta px-3 py-1 rounded-full hover:bg-cta/20 transition-colors cursor-pointer"
          >
            #{tag} <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
