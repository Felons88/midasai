interface BarChartItem {
  label: string
  value: number
  sublabel?: string
}

interface BarChartProps {
  items: BarChartItem[]
  valuePrefix?: string
  maxValue?: number
  emptyMessage?: string
}

export function BarChart({
  items,
  valuePrefix = "",
  maxValue,
  emptyMessage = "No data yet.",
}: BarChartProps) {
  if (items.length === 0) {
    return <p className="text-sm text-text-tertiary">{emptyMessage}</p>
  }

  const peak = maxValue ?? Math.max(...items.map((i) => i.value), 1)

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = peak > 0 ? Math.round((item.value / peak) * 100) : 0
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm mb-1 gap-2">
              <span className="text-text-primary truncate">{item.label}</span>
              <span className="text-text-secondary shrink-0">
                {valuePrefix}
                {item.value.toLocaleString()}
                {item.sublabel ? ` · ${item.sublabel}` : ""}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cta/80 to-cta transition-all"
                style={{ width: `${Math.max(pct, item.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
