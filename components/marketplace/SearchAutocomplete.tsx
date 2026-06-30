"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function SearchAutocomplete({
  initialQuery = "",
  onSearch,
}: {
  initialQuery?: string
  onSearch?: (query: string) => void
}) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [trending, setTrending] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.suggestions || [])
        setTrending(data.trending || [])
      }
    } catch (error) {
      console.error("Autocomplete error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSuggestions(query)
    }, 150)
    return () => clearTimeout(timeout)
  }, [query, fetchSuggestions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const navigateToSearch = useCallback(
    (term: string) => {
      if (onSearch) {
        onSearch(term)
      } else {
        router.push(`/search?q=${encodeURIComponent(term)}`)
      }
    },
    [onSearch, router]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigateToSearch(query.trim())
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = [query, ...suggestions]
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % items.length)
      setIsOpen(true)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      const selected = items[activeIndex]
      setQuery(selected)
      navigateToSearch(selected)
      setIsOpen(false)
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const hasDropdown = isOpen && (query.length >= 2 || trending.length > 0)

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      role="combobox"
      aria-expanded={hasDropdown}
      aria-controls="search-suggestions"
      aria-haspopup="listbox"
    >
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(-1)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Skills, MCP Servers, Agents, Workflows..."
          className="h-10 w-full rounded-lg border border-white/10 bg-surface pl-10 pr-24 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
          aria-label="Search marketplace"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 rounded-md bg-cta px-3 text-xs font-medium text-primary-foreground hover:bg-cta/90 transition-smooth"
        >
          Search
        </button>
      </form>

      {hasDropdown && (
        <div
          id="search-suggestions"
          className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-surface shadow-2xl overflow-hidden"
          role="listbox"
        >
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  onClick={() => {
                    setQuery(suggestion)
                    navigateToSearch(suggestion)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-lg transition-smooth",
                    activeIndex === index ? "bg-white/10 text-text-primary" : "text-text-secondary hover:bg-white/5"
                  )}
                >
                  <Search className="h-4 w-4 text-text-tertiary" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {query.length < 2 && trending.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                <TrendingUp className="h-3.5 w-3.5" />
                Trending searches
              </div>
              {trending.map((term, index) => (
                <button
                  key={term}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  onClick={() => {
                    setQuery(term)
                    navigateToSearch(term)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm rounded-lg transition-smooth",
                    activeIndex === index ? "bg-white/10 text-text-primary" : "text-text-secondary hover:bg-white/5"
                  )}
                >
                  <Sparkles className="h-4 w-4 text-cta" />
                  {term}
                </button>
              ))}
            </div>
          )}

          {query.length >= 2 && suggestions.length === 0 && !loading && (
            <div className="px-5 py-4 text-sm text-text-tertiary">
              No suggestions found. Press Enter to search.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
