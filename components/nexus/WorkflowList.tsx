"use client"

import { useState, useMemo, useRef } from "react"
import { Plus, Play, Edit3, Trash2, Clock, CheckCircle, XCircle, Pause, Archive, Activity, Search, Copy, SortAsc, SortDesc, Upload, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { NexusWorkflow, WorkflowStatus } from "@/lib/nexus/types"

const STATUS_CONFIG: Record<WorkflowStatus, { icon: React.ElementType; label: string; color: string }> = {
  draft: { icon: Edit3, label: "Draft", color: "text-white/40" },
  active: { icon: CheckCircle, label: "Active", color: "text-emerald-400" },
  paused: { icon: Pause, label: "Paused", color: "text-amber-400" },
  archived: { icon: Archive, label: "Archived", color: "text-white/20" },
}

type SortField = "name" | "updated_at" | "execution_count"

interface WorkflowListProps {
  workflows: NexusWorkflow[]
  onOpen: (workflow: NexusWorkflow) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onExecute: (id: string) => void
  onClone?: (workflow: NexusWorkflow) => void
  onImportN8n?: (file: File) => void
  executing: string | null
}

export function WorkflowList({ workflows, onOpen, onCreate, onDelete, onExecute, onClone, onImportN8n, executing }: WorkflowListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<WorkflowStatus | "all">("all")
  const [sortField, setSortField] = useState<SortField>("updated_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [showImportMenu, setShowImportMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortDir("desc") }
  }

  const handleImportN8n = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImportN8n) {
      onImportN8n(file)
    }
    setShowImportMenu(false)
  }

  const filtered = useMemo(() => {
    let list = [...workflows]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(w => w.name.toLowerCase().includes(q) || (w.description ?? "").toLowerCase().includes(q))
    }
    if (filterStatus !== "all") list = list.filter(w => w.status === filterStatus)
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === "name") cmp = a.name.localeCompare(b.name)
      else if (sortField === "execution_count") cmp = a.execution_count - b.execution_count
      else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })
    return list
  }, [workflows, search, filterStatus, sortField, sortDir])

  const SortIcon = sortDir === "asc" ? SortAsc : SortDesc

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Workflows</h2>
          <p className="text-xs text-white/40 mt-0.5">{filtered.length} of {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {onImportN8n && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportN8n}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileJson className="h-3.5 w-3.5 mr-1.5" />
                Import n8n
              </Button>
            </>
          )}
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          <Input
            placeholder="Search workflows…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30"
          />
        </div>
        {(["all", "active", "draft", "paused", "archived"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "h-7 px-2.5 rounded-lg text-xs font-medium capitalize transition-colors",
              filterStatus === s
                ? "bg-violet-600 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
            )}
          >
            {s}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          {(["name", "updated_at", "execution_count"] as SortField[]).map(f => (
            <button
              key={f}
              onClick={() => toggleSort(f)}
              className={cn(
                "h-7 px-2 rounded-lg text-[10px] transition-colors flex items-center gap-1",
                sortField === f ? "bg-white/[0.08] text-white/70" : "text-white/30 hover:text-white/60"
              )}
            >
              {f === "updated_at" ? "Date" : f === "execution_count" ? "Runs" : "Name"}
              {sortField === f && <SortIcon className="h-2.5 w-2.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {workflows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.08] py-16 text-center">
          <Activity className="h-10 w-10 text-white/10 mx-auto mb-4" />
          <p className="text-sm text-white/30 mb-4">No workflows yet</p>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create your first workflow
          </Button>
        </div>
      )}

      {filtered.length === 0 && workflows.length > 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.06] py-12 text-center">
          <Search className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No workflows match your search</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((wf) => {
          const cfg = STATUS_CONFIG[wf.status]
          const StatusIcon = cfg.icon
          const isExecuting = executing === wf.id

          return (
            <div
              key={wf.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-all group"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon className={cn("h-3.5 w-3.5 flex-shrink-0", cfg.color)} />
                    <span className={cn("text-xs", cfg.color)}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={isExecuting || wf.definition.nodes.length === 0}
                      onClick={() => onExecute(wf.id)}
                      title="Execute"
                    >
                      <Play className={cn("h-3 w-3", isExecuting && "animate-pulse")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onOpen(wf)} title="Edit">
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    {onClone && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onClone(wf)} title="Clone">
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {deleteConfirm === wf.id ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300"
                        onClick={() => { onDelete(wf.id); setDeleteConfirm(null) }}
                        title="Confirm delete"
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setDeleteConfirm(wf.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 truncate">{wf.name}</h3>
                {wf.description && (
                  <p className="text-xs text-white/40 line-clamp-2 mb-3">{wf.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-white/30">
                  <span>{wf.definition.nodes.length} nodes</span>
                  <span>{wf.execution_count} runs</span>
                  {wf.last_execution_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(wf.last_execution_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-4 pb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => onOpen(wf)}
                >
                  Open Editor
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
