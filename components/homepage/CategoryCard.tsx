"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export type CategoryItem = {
  slug: string
  label: string
  icon: LucideIcon
  count?: number
  gradient: string
  description: string
}

export function CategoryCard({ category, index = 0 }: { category: CategoryItem; index?: number }) {
  const Icon = category.icon
  const count = category.count ?? 0

  return (
    <Link
      href={`/search?category=${encodeURIComponent(category.slug)}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-sm p-5",
        "hover:border-white/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
      )}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: category.gradient,
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{
              background: category.gradient.replace("135deg", "135deg").replace("0.15", "0.2"),
            }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-text-tertiary group-hover:text-cta group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
        </div>
        <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-white transition-colors duration-300">
          {category.label}
        </h3>
        <p className="text-xs text-text-tertiary line-clamp-2 mb-3">{category.description}</p>
        {count > 0 && (
          <div className="text-xs text-text-secondary font-medium">
            {count.toLocaleString()} {count === 1 ? "asset" : "assets"}
          </div>
        )}
      </div>
    </Link>
  )
}
