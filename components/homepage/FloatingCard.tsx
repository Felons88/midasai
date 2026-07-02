"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export function FloatingCard({
  icon: Icon,
  title,
  subtitle,
  className,
  delay = 0,
  variant = "gold",
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  className?: string
  delay?: number
  variant?: "gold" | "blue" | "purple"
}) {
  const gradients = {
    gold: "from-cta/20 to-cta/5 border-cta/20",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
  }

  const iconColors = {
    gold: "text-cta",
    blue: "text-blue-400",
    purple: "text-purple-400",
  }

  return (
    <div
      className={cn(
        "absolute flex items-center gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-2xl backdrop-blur-xl",
        "animate-float",
        gradients[variant],
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <Icon className={cn("h-5 w-5", iconColors[variant])} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-text-primary truncate">{title}</div>
        {subtitle && <div className="text-xs text-text-tertiary">{subtitle}</div>}
      </div>
    </div>
  )
}
