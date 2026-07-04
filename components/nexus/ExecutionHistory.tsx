"use client"

import { CheckCircle, XCircle, Clock, Loader2, Ban, ChevronDown, ChevronRight, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import type { WorkflowExecution, ExecutionStatus } from "@/lib/nexus/types"

const STATUS_CONFIG: Record<ExecutionStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-white/40", label: "Pending" },
  running: { icon: Loader2, color: "text-blue-400", label: "Running" },
  completed: { icon: CheckCircle, color: "text-emerald-400", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  cancelled: { icon: Ban, color: "text-white/30", label: "Cancelled" },
}

interface ExecutionHistoryProps {
  executions: WorkflowExecution[]
  loading?: boolean
}

function formatDuration(ms?: number | null) {
  if (!ms) return "—"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function ExecutionHistory({ executions, loading }: ExecutionHistoryProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    )
  }

  if (executions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.08] py-16 text-center">
        <Activity className="h-10 w-10 text-white/10 mx-auto mb-4" />
        <p className="text-sm text-white/30">No executions yet</p>
        <p className="text-xs text-white/20 mt-1">Run a workflow to see history here</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {executions.map((execution) => {
        const cfg = STATUS_CONFIG[execution.status]
        const StatusIcon = cfg.icon
        const isExpanded = expanded === execution.id
        const nodeResults = Array.isArray(execution.node_results) ? execution.node_results : []

        return (
          <div
            key={execution.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden"
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              onClick={() => setExpanded(isExpanded ? null : execution.id)}
            >
              <StatusIcon className={cn("h-4 w-4 flex-shrink-0", cfg.color, execution.status === "running" && "animate-spin")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {(execution.workflow as any)?.name ?? "Workflow"}
                  </span>
                  <span className={cn("text-xs", cfg.color)}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
                  <span>{formatDate(execution.started_at)}</span>
                  <span>{formatDuration(execution.duration_ms)}</span>
                  <span>{nodeResults.length} nodes</span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-2 border-t border-white/[0.04]">
                {execution.error_message && (
                  <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                    <p className="text-xs text-red-400">{execution.error_message}</p>
                  </div>
                )}
                {nodeResults.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-white/40 mb-2">Node Results</p>
                    <div className="space-y-1.5">
                      {nodeResults.map((nr, i) => {
                        const nrCfg = STATUS_CONFIG[nr.status] ?? STATUS_CONFIG.completed
                        const NrIcon = nrCfg.icon
                        return (
                          <div key={i} className="flex items-center gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2">
                            <NrIcon className={cn("h-3 w-3 flex-shrink-0", nrCfg.color)} />
                            <span className="text-xs text-white/60 flex-1 truncate">{nr.node_id}</span>
                            <span className="text-xs text-white/30">{formatDuration(nr.duration_ms)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
