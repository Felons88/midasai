"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SORT_OPTIONS = [
  { value: "popular", label: "Most downloaded" },
  { value: "newest", label: "Recently updated" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const

interface SearchFiltersProps {
  query?: string
  type?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  minRating?: string
}

function buildUrl(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "any") sp.set(key, value)
  })
  const qs = sp.toString()
  return qs ? `/search?${qs}` : "/search"
}

export function SearchFilters({
  query,
  type,
  minPrice,
  maxPrice,
  sort = "popular",
  minRating,
}: SearchFiltersProps) {
  const router = useRouter()
  const [sortValue, setSortValue] = useState(sort)
  const [ratingValue, setRatingValue] = useState(minRating ?? "any")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    router.push(
      buildUrl({
        query: (form.get("query") as string) || undefined,
        type: type || undefined,
        minPrice: (form.get("minPrice") as string) || undefined,
        maxPrice: (form.get("maxPrice") as string) || undefined,
        sort: sortValue,
        minRating: ratingValue,
      })
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 p-4 glass rounded-xl"
    >
      <div className="lg:col-span-2 space-y-1">
        <Label htmlFor="filter-query" className="text-text-tertiary text-xs">
          Keywords
        </Label>
        <Input
          id="filter-query"
          name="query"
          defaultValue={query}
          placeholder="Search listings..."
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="minPrice" className="text-text-tertiary text-xs">
          Min price
        </Label>
        <Input
          id="minPrice"
          name="minPrice"
          type="number"
          min={0}
          step={0.01}
          defaultValue={minPrice}
          placeholder="0"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="maxPrice" className="text-text-tertiary text-xs">
          Max price
        </Label>
        <Input
          id="maxPrice"
          name="maxPrice"
          type="number"
          min={0}
          step={0.01}
          defaultValue={maxPrice}
          placeholder="Any"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-text-tertiary text-xs">Min rating</Label>
        <Select value={ratingValue} onValueChange={setRatingValue}>
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any rating</SelectItem>
            <SelectItem value="4">4+ stars</SelectItem>
            <SelectItem value="3">3+ stars</SelectItem>
            <SelectItem value="2">2+ stars</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-text-tertiary text-xs">Sort by</Label>
        <Select value={sortValue} onValueChange={setSortValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="submit" className="shadow-glow">
          Apply filters
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/search">Reset</Link>
        </Button>
      </div>
    </form>
  )
}
