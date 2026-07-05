import { Badge } from "@/components/ui/badge"

export function ProjectNameCell({ row }: { row: any }) {
  return (
    <div>
      <p className="font-medium text-white">{row.name}</p>
      <p className="text-xs text-white/40">{row.type}</p>
    </div>
  )
}

export function ProjectStatusCell({ row }: { row: any }) {
  return (
    <Badge variant="outline" className="text-[10px] uppercase">
      {row.status}
    </Badge>
  )
}

export function ProjectProgressCell({ row }: { row: any }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${Math.max(0, Math.min(100, row.confidence ?? 0))}%` }}
        />
      </div>
      <span className="text-xs text-white/50">{row.confidence ?? 0}%</span>
    </div>
  )
}

export function ProjectFilesCell({ row }: { row: any }) {
  return <span className="text-white/70 text-sm">{row.fileCount ?? 0}</span>
}

export function ProjectCreatedCell({ row }: { row: any }) {
  return (
    <span className="text-white/50 text-xs">
      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
    </span>
  )
}
