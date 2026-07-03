"use client"

import { AnimatedCounter } from "./AnimatedCounter"

export function StatsSection() {
  // Static trust metrics for the homepage stats bar.
  const stats = [
    { value: 27423, label: "AI Assets", suffix: "+", decimals: 0 },
    { value: 4891, label: "Creators", suffix: "+", decimals: 0 },
    { value: 3.2, label: "Downloads", suffix: "M+", decimals: 1 },
    { value: 42, label: "Categories", suffix: "", decimals: 0 },
    { value: 8700, label: "Workflows", suffix: "+", decimals: 0 },
    { value: 5100, label: "Agents", suffix: "+", decimals: 0 },
    { value: 185, label: "Users", suffix: "K+", decimals: 0 },
  ]

  return (
    <section className="relative -mt-6 z-20">
      <div className="absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-background/0 via-background/80 to-background pointer-events-none" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-2xl shadow-2xl py-8 md:py-10 px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 md:gap-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-text-primary mb-1">
                    <AnimatedCounter
                      value={stat.value}
                      suffix={stat.suffix}
                      decimals={stat.decimals}
                    />
                  </div>
                  <div className="text-sm text-text-secondary">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
