import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, sub, accent, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-white/[0.02] p-4",
        className
      )}
    >
      <p className={cn("text-2xl font-semibold tabular-nums", accent ? "text-amber-400" : "text-white")}>
        {value}
      </p>
      <p className="text-xs text-white/45 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
    </div>
  )
}

type TrendBarProps = {
  data: { date: string; value: number }[]
  valuePrefix?: string
}

export function TrendBars({ data, valuePrefix = "$" }: TrendBarProps) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            className="w-full rounded-t bg-amber-500/70 hover:bg-amber-400 transition-colors"
            style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            title={`${d.date}: ${valuePrefix}${d.value.toFixed(2)}`}
          />
        </div>
      ))}
    </div>
  )
}

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-white">{title}</h1>
        {description && <p className="text-sm text-white/45 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: string[]
  children: React.ReactNode
  empty?: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">{children}</tbody>
        </table>
      </div>
      {empty && (
        <p className="text-center text-white/40 text-sm py-12">{empty}</p>
      )}
    </div>
  )
}

export function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "UNKNOWN"
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400",
    COMPLETED: "bg-emerald-500/10 text-emerald-400",
    PENDING: "bg-amber-500/10 text-amber-400",
    REFUNDED: "bg-blue-500/10 text-blue-400",
    REJECTED: "bg-red-500/10 text-red-400",
    FAILED: "bg-red-500/10 text-red-400",
    CANCELLED: "bg-gray-500/10 text-gray-400",
    OPEN: "bg-amber-500/10 text-amber-400",
    RESOLVED: "bg-emerald-500/10 text-emerald-400",
    DRAFT: "bg-gray-500/10 text-gray-400",
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[s] ?? "bg-white/10 text-white/60"}`}>
      {s}
    </span>
  )
}
