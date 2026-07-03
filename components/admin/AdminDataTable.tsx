"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type AdminColumn<T> = {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
}

export type AdminDataTableProps<T> = {
  columns: AdminColumn<T>[]
  rows: T[]
  keyField: keyof T
  title?: string
  description?: string
  pageSize?: number
  emptyMessage?: string
  exportFileName?: string
  onRowClick?: (row: T) => void
  topActions?: React.ReactNode
}

export function AdminDataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  keyField,
  title,
  description,
  pageSize = 20,
  emptyMessage = "No records found",
  exportFileName = "export.csv",
  onRowClick,
  topActions,
}: AdminDataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue
        const col = columns.find((c) => c.key === key)
        const raw = col?.render ? String(col.render(row)) : String((row as Record<string, unknown>)[key] ?? "")
        if (!raw.toLowerCase().includes(value.toLowerCase())) return false
      }
      return true
    })
  }, [rows, filters, columns])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = col.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[sort.key] ?? ""
      const bVal = col.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[sort.key] ?? ""
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sort.dir === "asc" ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return sort.dir === "asc" ? -1 : 1
      if (aStr > bStr) return sort.dir === "asc" ? 1 : -1
      return 0
    })
  }, [filtered, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null
      }
      return { key, dir: "asc" }
    })
    setPage(1)
  }

  function exportCsv() {
    const headers = columns.map((c) => c.label).join(",")
    const lines = sorted.map((row) =>
      columns
        .map((c) => {
          const val = c.render ? String(c.render(row)) : String((row as Record<string, unknown>)[c.key] ?? "")
          return `"${val.replace(/"/g, '""')}"`
        })
        .join(",")
    )
    const csv = [headers, ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = exportFileName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {(title || description || topActions) && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
            {description && <p className="text-sm text-white/45">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {topActions}
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wide",
                      col.sortable && "cursor-pointer select-none hover:text-white/70"
                    )}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sort?.key === col.key && (
                        <span className="text-amber-400">
                          {sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-white/[0.06]">
                {columns.map((col) => (
                  <th key={`filter-${col.key}`} className="px-4 py-2">
                    {col.filterable !== false && (
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
                        <Input
                          placeholder="Filter"
                          value={filters[col.key] ?? ""}
                          onChange={(e) => {
                            setFilters((prev) => ({ ...prev, [col.key]: e.target.value }))
                            setPage(1)
                          }}
                          className="h-7 pl-7 text-xs bg-white/[0.03] border-white/[0.06] placeholder:text-white/20"
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-white/40 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr
                    key={String(row[keyField])}
                    className={cn(
                      "hover:bg-white/[0.02] transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {sorted.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-white/40">
              {sorted.length} records · Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-xs"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
