"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getDocsAdjacentPages } from "@/lib/docs/navigation"
import { cn } from "@/lib/utils"

export function DocsPager() {
  const pathname = usePathname()
  const { previous, next } = getDocsAdjacentPages(pathname)

  if (!previous && !next) return null

  return (
    <nav
      aria-label="Documentation pagination"
      className="mt-12 flex flex-col gap-3 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-stretch sm:justify-between"
    >
      {previous ? (
        <Link
          href={previous.href}
          className={cn(
            "group flex min-w-0 flex-1 flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition",
            "hover:border-amber-500/30 hover:bg-white/[0.04]",
            !next && "sm:max-w-md"
          )}
        >
          <span className="mb-1 flex items-center gap-1 text-xs text-white/40">
            <ChevronLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
            {previous.description}
          </span>
          <span className="text-sm font-semibold text-white group-hover:text-amber-300">
            Previous: {previous.title}
          </span>
        </Link>
      ) : (
        <div className="hidden flex-1 sm:block" />
      )}

      {next ? (
        <Link
          href={next.href}
          className={cn(
            "group flex min-w-0 flex-1 flex-col rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-right transition",
            "hover:border-amber-500/30 hover:bg-white/[0.04]",
            !previous && "sm:ml-auto sm:max-w-md"
          )}
        >
          <span className="mb-1 flex items-center justify-end gap-1 text-xs text-white/40">
            {next.description}
            <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
          <span className="text-sm font-semibold text-white group-hover:text-amber-300">
            Next: {next.title}
          </span>
        </Link>
      ) : (
        <div className="hidden flex-1 sm:block" />
      )}
    </nav>
  )
}
