"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  MARKETPLACE_PAGE_SIZES,
  type MarketplacePageSize,
} from "@/lib/marketplace/pagination"

type MarketplacePaginationProps = {
  basePath: string
  page: number
  limit: MarketplacePageSize
  total: number
  totalPages: number
}

function buildHref(basePath: string, page: number, limit: number) {
  const params = new URLSearchParams()
  if (page > 1) params.set("page", String(page))
  if (limit !== 50) params.set("limit", String(limit))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function MarketplacePagination({
  basePath,
  page,
  limit,
  total,
  totalPages,
}: MarketplacePaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function onLimitChange(nextLimit: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("limit", nextLimit)
    params.delete("page")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-tertiary">
        Showing <span className="text-text-primary font-medium">{from}–{to}</span> of{" "}
        <span className="text-text-primary font-medium">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-text-tertiary">
          Per page
          <select
            value={String(limit)}
            onChange={(e) => onLimitChange(e.target.value)}
            className="rounded-lg border border-white/10 bg-surface px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-cta"
          >
            {MARKETPLACE_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            asChild={page > 1}
            className="border-white/10"
          >
            {page > 1 ? (
              <Link href={buildHref(basePath, page - 1, limit)}>
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4" />
                Prev
              </span>
            )}
          </Button>
          <span className="px-3 text-sm text-text-secondary">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            asChild={page < totalPages}
            className="border-white/10"
          >
            {page < totalPages ? (
              <Link href={buildHref(basePath, page + 1, limit)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
