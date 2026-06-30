"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TYPEWRITER_TERMS = [
  "code review skills",
  "MCP servers for GitHub",
  "Cursor rules for React",
  "Claude document skills",
  "prompt packs for sales",
  "Windsurf workflows",
  "Supabase MCP tools",
  "AI agent templates",
  "test automation skills",
  "GitHub Copilot resources",
  "SEO writing skills",
  "database migration agents",
  "API design plugins",
  "debugging workflows",
  "security audit skills",
]

export default function HeroSearchBox() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [focused, setFocused] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [termIndex, setTermIndex] = useState(0)
  const [typed, setTyped] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setMounted(true)
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
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/search")
    }
  }

  const showTypewriter = mounted && !focused && !query

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-4 justify-center mb-12 max-w-3xl mx-auto animate-fade-in-up w-full"
      style={{ animationDelay: "0.3s" }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary z-20 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={mounted ? undefined : "Search for skills, plugins, agents..."}
          className={cn(
            "w-full h-14 pl-12 pr-4 rounded-xl border border-white/10 bg-surface text-text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth",
            showTypewriter && "text-transparent caret-transparent"
          )}
          aria-label="Search marketplace"
        />
        {showTypewriter && (
          <div
            className="absolute inset-y-0 left-12 right-4 flex items-center gap-1.5 text-base pointer-events-none z-10 truncate"
            aria-hidden
          >
            <span className="text-white/50 shrink-0">Search for</span>
            <span className="text-white/80 truncate">{typed}</span>
            <span className="inline-block w-[2px] h-5 bg-amber-400 ml-0.5 shrink-0 animate-pulse" />
          </div>
        )}
      </div>
      <Button type="submit" size="lg" className="h-14 px-8 text-base shrink-0">
        Search
      </Button>
    </form>
  )
}
