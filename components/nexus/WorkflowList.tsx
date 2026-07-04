"use client"

import { useState } from "react"
import { Plus, Play, Edit3, Trash2, Clock, CheckCircle, XCircle, Pause, Archive, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { NexusWorkflow, WorkflowStatus } from "@/lib/nexus/types"

const STATUS_CONFIG: Record<WorkflowStatus, { icon: React.ElementType; label: string; color: string }> = {
  draft: { icon: Edit3, label: "Draft", color: "text-white/40" },
  active: { icon: CheckCircle, label: "Active", color: "text-emerald-400" },
  paused: { icon: Pause, label: "Paused", color: "text-amber-400" },
  archived: { icon: Archive, label: "Archived", color: "text-white/20" },
}

interface WorkflowListProps {
  workflows: NexusWorkflow[]
  onOpen: (workflow: NexusWorkflow) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onExecute: (id: string) => void
  executing: string | null
}

export function WorkflowList({ workflows, onOpen, onCreate, onDelete, onExecute, executing }: WorkflowListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Workflows</h2>
          <p className="text-xs text-white/40 mt-0.5">{workflows.length} workflow{workflows.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Workflow
        </Button>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {workflows.map((wf) => {
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
                    >
                      <Play className={cn("h-3 w-3", isExecuting && "animate-pulse")} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onOpen(wf)}>
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    {deleteConfirm === wf.id ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300"
                        onClick={() => { onDelete(wf.id); setDeleteConfirm(null) }}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setDeleteConfirm(wf.id)}
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
