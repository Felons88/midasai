"use client"

import { cn } from "@/lib/utils"

export function SectionHeader({
  badge,
  title,
  description,
  align = "center",
  className,
}: {
  badge?: string
  title: string
  description?: string
  align?: "left" | "center"
  className?: string
}) {
  return (
    <div
      className={cn(
        "mb-10",
        align === "center" ? "text-center max-w-2xl mx-auto" : "text-left",
        className
      )}
    >
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cta animate-pulse" />
          <span className="text-xs font-medium text-text-secondary">{badge}</span>
        </div>
      )}
      <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3 tracking-tight">{title}</h2>
      {description && (
        <p className="text-base md:text-lg text-text-secondary leading-relaxed">{description}</p>
      )}
    </div>
  )
}
