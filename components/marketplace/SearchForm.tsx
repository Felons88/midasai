"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchFormProps {
  defaultQuery?: string
  activeType?: string
}

export function SearchForm({ defaultQuery = "", activeType }: SearchFormProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultQuery)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const params = new URLSearchParams()
    const trimmed = query.trim()
    if (trimmed) params.set("query", trimmed)
    if (activeType) params.set("type", activeType)
    const qs = params.toString()
    router.push(qs ? `/search?${qs}` : "/search")
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for skills, plugins, agents..."
        className="h-14 pl-12 text-lg"
        aria-label="Search listings"
      />
    </form>
  )
}
