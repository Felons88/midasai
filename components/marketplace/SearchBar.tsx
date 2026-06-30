"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

interface SearchBarProps {
  defaultQuery?: string
  placeholder?: string
  className?: string
  inputClassName?: string
}

export function SearchBar({
  defaultQuery = "",
  placeholder = "Search marketplace...",
  className = "relative",
  inputClassName = "h-10 w-full rounded-lg border border-white/10 bg-surface text-text-primary placeholder:text-text-tertiary pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth",
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/search?query=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/search")
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
        aria-label="Search marketplace"
      />
    </form>
  )
}
