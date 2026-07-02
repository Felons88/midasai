"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight, Clock, TrendingUp, Command, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const TYPEWRITER_TERMS = [
  "Claude Code skills for React",
  "Cursor rules for TypeScript",
  "Codex agents for backend",
  "Windsurf workflows",
  "AI automation packs",
  "Prompt packs for sales",
  "Memory systems for Claude",
  "Documentation templates",
  "GitHub templates",
  "Browser automation skills",
  "DevOps Claude skills",
  "Security audit agents",
]

const TRENDING_SEARCHES = [
  "Claude Code Skills",
  "Cursor Rules",
  "AI Agents",
  "Workflow Templates",
  "Prompt Packs",
  "Automation Packs",
]

const POPULAR_SEARCHES = [
  "React Frontend",
  "Backend API",
  "DevOps",
  "Design System",
  "Productivity",
]

export function HeroSearchBox() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [termIndex, setTermIndex] = useState(0)
  const [typed, setTyped] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("midasai_recent_searches")
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 4))
      } catch {
        setRecentSearches([])
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted || focused || query) return

    const full = TYPEWRITER_TERMS[termIndex]
    const delay = deleting ? 35 : 55

    const timer = window.setTimeout(() => {
      if (!deleting) {
        const next = full.slice(0, typed.length + 1)
        setTyped(next)
        if (next === full) {
          window.setTimeout(() => setDeleting(true), 1800)
        }
      } else {
        const next = full.slice(0, typed.length - 1)
        setTyped(next)
        if (next === "") {
          setDeleting(false)
          setTermIndex((i) => (i + 1) % TYPEWRITER_TERMS.length)
        }
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [typed, deleting, termIndex, focused, query, mounted])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    saveRecentSearch(trimmed)
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  function saveRecentSearch(term: string) {
    const saved = localStorage.getItem("midasai_recent_searches")
    let current: string[] = []
    try {
      current = JSON.parse(saved || "[]")
    } catch {
      current = []
    }
    const updated = [term, ...current.filter((t) => t !== term)].slice(0, 5)
    localStorage.setItem("midasai_recent_searches", JSON.stringify(updated))
    setRecentSearches(updated)
  }

  function handleSearchClick(term: string) {
    saveRecentSearch(term)
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  const showTypewriter = mounted && !focused && !query
  const showDropdown = focused && (query || recentSearches.length > 0 || TRENDING_SEARCHES.length > 0)

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "relative flex items-center gap-2 rounded-2xl border bg-surface/80 backdrop-blur-xl transition-all duration-300",
            focused
              ? "border-cta/50 shadow-[0_0_60px_rgba(202,138,4,0.12)] ring-1 ring-cta/20"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <Search className="ml-5 h-5 w-5 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder={mounted ? "Search skills, agents, workflows, templates..." : "Search marketplace..."}
            className={cn(
              "flex-1 h-14 bg-transparent text-base text-text-primary placeholder:text-text-tertiary",
              "focus-visible:outline-none",
              showTypewriter && "text-transparent caret-transparent"
            )}
            aria-label="Search marketplace"
          />
          {showTypewriter && (
            <div
              className="absolute inset-y-0 left-[3.25rem] right-32 flex items-center gap-1.5 text-base pointer-events-none z-10 truncate"
              aria-hidden
            >
              <span className="text-text-tertiary shrink-0">Search for</span>
              <span className="text-text-secondary truncate">{typed}</span>
              <span className="inline-block w-[2px] h-5 bg-cta ml-0.5 shrink-0 animate-pulse" />
            </div>
          )}
          <div className="hidden sm:flex items-center gap-2 pr-3">
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-[10px] text-text-tertiary border border-white/10">
              <Command className="h-3 w-3" />
              K
            </kbd>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-cta text-primary-foreground text-sm font-semibold hover:bg-cta-light transition-smooth flex items-center gap-1.5"
            >
              Search
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-surface/95 backdrop-blur-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
          {query ? (
            <div className="p-3">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-tertiary uppercase tracking-wider">
                <Search className="h-3.5 w-3.5" />
                Suggested
              </div>
              <button
                onClick={() => handleSearchClick(query)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-left group transition-smooth"
              >
                <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center shrink-0">
                  <ArrowRight className="h-4 w-4 text-cta group-hover:translate-x-0.5 transition-smooth" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text-primary font-medium">Search for "{query}"</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-tertiary uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    Recent
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearchClick(term)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-left transition-smooth"
                      >
                        <Clock className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                        <span className="text-sm text-text-secondary">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-tertiary uppercase tracking-wider">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Trending
                </div>
                <div className="flex flex-wrap gap-2 px-3 pt-1">
                  {TRENDING_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearchClick(term)}
                      className="px-3 py-1.5 rounded-full text-xs bg-white/5 text-text-secondary hover:bg-cta/10 hover:text-cta border border-white/5 transition-smooth"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-text-tertiary uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  Popular
                </div>
                <div className="flex flex-wrap gap-2 px-3 pt-1">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearchClick(term)}
                      className="px-3 py-1.5 rounded-full text-xs bg-white/5 text-text-secondary hover:bg-cta/10 hover:text-cta border border-white/5 transition-smooth"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile submit button */}
      <div className="sm:hidden mt-3 flex justify-center">
        <button
          onClick={handleSubmit}
          className="w-full h-11 rounded-xl bg-cta text-primary-foreground font-semibold text-sm hover:bg-cta-light transition-smooth"
        >
          Search
        </button>
      </div>
    </div>
  )
}
