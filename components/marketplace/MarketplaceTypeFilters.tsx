"use client"

import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const LISTING_TYPES = [
  { value: "ALL", label: "All" },
  { value: "SKILL", label: "Skills" },
  { value: "PLUGIN", label: "Plugins" },
  { value: "MCP", label: "MCP" },
  { value: "AGENT", label: "Agents" },
  { value: "PROMPT", label: "Prompts" },
  { value: "WORKFLOW", label: "Workflows" },
  { value: "TEMPLATE", label: "Templates" },
] as const

interface MarketplaceTypeFiltersProps {
  activeType?: string
}

export function MarketplaceTypeFilters({ activeType }: MarketplaceTypeFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  function setType(type: string) {
    const params = new URLSearchParams()
    if (type !== "ALL") params.set("type", type)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      {LISTING_TYPES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setType(value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors",
            (activeType ?? "ALL") === value || (!activeType && value === "ALL")
              ? "border-cta/40 bg-cta/10 text-cta"
              : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/[0.06]"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
