"use client"

import { AnimatedCounter } from "./AnimatedCounter"

const TYPE_LABELS: Record<string, string> = {
  SKILL: "Skills",
  AGENT: "Agents",
  PLUGIN: "Plugins",
  MCP: "MCPs",
  PROMPT: "Prompts",
  WORKFLOW: "Workflows",
  TEMPLATE: "Templates",
  AUTOMATION: "Automations",
  DEVELOPER_TOOL: "Dev Tools",
}

export function StatsSection({
  totalListings,
  totalCreators,
  totalDownloads,
  averageRating,
  totalCategories,
  totalReviews,
  typeCounts,
}: {
  totalListings: number
  totalCreators: number
  totalDownloads: number
  averageRating: number
  totalCategories: number
  totalReviews: number
  typeCounts: Record<string, number>
}) {
  const allStats = [
    { value: totalListings, label: "AI Assets", suffix: "+", decimals: 0, min: 1 },
    { value: totalDownloads, label: "Installs", suffix: totalDownloads >= 1000000 ? "M+" : "+", decimals: 0, min: 1 },
    { value: totalReviews, label: "Reviews", suffix: "+", decimals: 0, min: 1 },
    { value: totalCreators, label: "Creators", suffix: "+", decimals: 0, min: 1 },
    { value: totalCategories, label: "Categories", suffix: "+", decimals: 0, min: 1 },
    { value: averageRating, label: "Rating", suffix: "/5", decimals: 1, min: 0.1 },
  ]

  const stats = allStats.filter((stat) => stat.value >= stat.min)

  const assetBreakdown = Object.entries(typeCounts)
    .filter(([_, count]) => (count ?? 0) > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${count} ${TYPE_LABELS[type] ?? type}`)
    .join(" · ")

  // Format large numbers for display
  const formatValue = (stat: typeof stats[0]) => {
    if (stat.label === "Installs" && stat.value >= 1000000) {
      return { value: stat.value / 1000000, display: `${(stat.value / 1000000).toFixed(1)}M+` }
    }
    return { value: stat.value, display: null }
  }

  if (stats.length === 0) return null

  return (
    <section className="relative -mt-6 z-20">
      <div className="absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-background/0 via-background/80 to-background pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-2xl shadow-2xl py-8 md:py-10 px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-4">
              {stats.map((stat, index) => {
                const { value, display } = formatValue(stat)
                return (
                  <div
                    key={stat.label}
                    className="text-center"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-3xl md:text-4xl font-bold text-text-primary mb-1">
                      {display ? (
                        <span>{display}</span>
                      ) : (
                        <AnimatedCounter
                          value={value}
                          suffix={stat.suffix}
                          decimals={stat.decimals}
                        />
                      )}
                    </div>
                    <div className="text-sm text-text-secondary">{stat.label}</div>
                    {stat.label === "AI Assets" && assetBreakdown && (
                      <div
                        className="text-[10px] text-text-tertiary mt-1 leading-tight truncate"
                        title={assetBreakdown}
                      >
                        {assetBreakdown}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
