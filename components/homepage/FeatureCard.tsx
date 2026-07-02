"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export type FeatureItem = {
  title: string
  description: string
  icon: LucideIcon
  gradient: string
  stat?: string
  statLabel?: string
}

export function FeatureCard({ feature, index = 0, className }: { feature: FeatureItem; index?: number; className?: string }) {
  const Icon = feature.icon

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/10 bg-surface/40 backdrop-blur-sm p-5",
        "hover:border-white/20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
        className
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: feature.gradient }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ background: feature.gradient.replace("0.15", "0.25") }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {feature.stat && (
            <div className="text-right">
              <div className="text-lg font-bold text-cta">{feature.stat}</div>
              <div className="text-[10px] text-text-tertiary uppercase tracking-wider">{feature.statLabel}</div>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-white transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
      </div>
    </div>
  )
}
