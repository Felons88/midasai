"use client"

import { AnimatedCounter } from "./AnimatedCounter"

export function StatsSection({
  totalListings,
  totalCreators,
  totalDownloads,
  averageRating,
}: {
  totalListings: number
  totalCreators: number
  totalDownloads: number
  averageRating: number
}) {
  const stats = [
    { value: totalListings, label: "Skills & Assets", suffix: "+" },
    { value: totalDownloads, label: "Installs", suffix: totalDownloads >= 1000000 ? "M+" : "+" },
    { value: totalCreators, label: "Creators", suffix: "+" },
    { value: averageRating, label: "Average Rating", suffix: "/5", decimals: 1 },
  ]

  // Format large numbers for display
  const formatValue = (stat: typeof stats[0]) => {
    if (stat.label === "Installs" && stat.value >= 1000000) {
      return { value: stat.value / 1000000, display: `${(stat.value / 1000000).toFixed(1)}M+` }
    }
    return { value: stat.value, display: null }
  }

  return (
    <section className="border-y border-white/5 bg-surface/30 py-10 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
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
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
