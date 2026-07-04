"use client"

import { useState } from "react"
import { Activity, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Cpu, GitBranch, Timer, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowExecution } from "@/lib/nexus/types"

interface NodeResult {
  node_id: string
  node_type_id: string
  status: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  error?: string
  duration_ms: number
}

interface WorkflowInspectorProps {
  executions: WorkflowExecution[]
  className?: string
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 60000) return "just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(dateStr).toLocaleDateString()
}

function NodeResultRow({ result }: { result: NodeResult }) {
  const [open, setOpen] = useState(false)
  const isSuccess = result.status === "completed" || result.status === "success"
  const isError = result.status === "error" || result.status === "failed"

  return (
    <div className="border border-white/[0.05] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.03]",
          isError && "bg-red-500/5"
        )}
      >
        {open ? <ChevronDown className="h-3 w-3 text-white/30 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 text-white/30 flex-shrink-0" />}
        <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
          {isSuccess && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
          {isError && <XCircle className="h-3.5 w-3.5 text-red-400" />}
          {!isSuccess && !isError && <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
        </div>
        <span className="text-xs text-white/70 font-mono truncate flex-1">{result.node_id}</span>
        <span className="text-[10px] text-white/30 flex-shrink-0">{formatDuration(result.duration_ms)}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-white/[0.04] space-y-2 bg-white/[0.01]">
          {result.error && (
            <div className="mt-2 px-2 py-1.5 rounded-md bg-red-500/8 border border-red-500/15">
              <p className="text-[10px] text-red-300 font-mono break-all">{result.error}</p>
            </div>
          )}
          {Object.keys(result.output ?? {}).length > 0 && (
            <div className="mt-2">
              <p className="text-[9px] text-white/30 mb-1 uppercase tracking-wide">Output</p>
              <pre className="text-[9px] text-white/50 font-mono bg-white/[0.02] rounded px-2 py-1.5 overflow-x-auto max-h-32">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          )}
          {Object.keys(result.input ?? {}).length > 0 && (
            <div>
              <p className="text-[9px] text-white/30 mb-1 uppercase tracking-wide">Config / Input</p>
              <pre className="text-[9px] text-white/30 font-mono bg-white/[0.02] rounded px-2 py-1.5 overflow-x-auto max-h-28">
                {JSON.stringify(result.input, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ExecutionRow({ execution }: { execution: WorkflowExecution }) {
  const [open, setOpen] = useState(false)
  const nodeResults: NodeResult[] = (execution.output_data as { node_results?: NodeResult[] })?.node_results ?? (execution.node_results as NodeResult[]) ?? []
  const isRunning = execution.status === "running" || execution.status === "pending"
  const isSuccess = execution.status === "completed"
  const isFailed = execution.status === "failed"

  const totalDuration = nodeResults.reduce((sum, n) => sum + (n.duration_ms ?? 0), 0)
  const failCount = nodeResults.filter(n => n.status === "error" || n.status === "failed").length
  const successCount = nodeResults.filter(n => n.status === "completed" || n.status === "success").length

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-all",
      isRunning ? "border-amber-500/30 bg-amber-500/5" :
      isSuccess ? "border-emerald-500/20 bg-white/[0.01]" :
      isFailed ? "border-red-500/20 bg-red-500/5" :
      "border-white/[0.06] bg-white/[0.01]"
    )}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex-shrink-0">
          {isRunning && <Cpu className="h-3.5 w-3.5 text-amber-400 animate-pulse" />}
          {isSuccess && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
          {isFailed && <XCircle className="h-3.5 w-3.5 text-red-400" />}
          {!isRunning && !isSuccess && !isFailed && <Clock className="h-3.5 w-3.5 text-white/30" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white capitalize">{execution.status}</span>
            {nodeResults.length > 0 && (
              <span className="text-[9px] text-white/30">{successCount}/{nodeResults.length} nodes</span>
            )}
            {failCount > 0 && (
              <span className="text-[9px] text-red-400">{failCount} failed</span>
            )}
          </div>
          <p className="text-[10px] text-white/30">{formatRelative(execution.started_at)}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          {totalDuration > 0 && <p className="text-[10px] text-white/30">{formatDuration(totalDuration)}</p>}
          {open ? <ChevronDown className="h-3 w-3 text-white/20 mt-0.5 ml-auto" /> : <ChevronRight className="h-3 w-3 text-white/20 mt-0.5 ml-auto" />}
        </div>
      </button>

      {open && nodeResults.length > 0 && (
        <div className="px-2 pb-2 space-y-1 border-t border-white/[0.05]">
          <p className="text-[9px] text-white/30 uppercase tracking-wide px-1 pt-2 pb-1">Node Results</p>
          {nodeResults.map(r => <NodeResultRow key={r.node_id} result={r} />)}
        </div>
      )}

      {open && nodeResults.length === 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-white/[0.04]">
          <p className="text-[10px] text-white/20">No node results available</p>
        </div>
      )}
    </div>
  )
}

export function WorkflowInspector({ executions, className }: WorkflowInspectorProps) {
  const [tab, setTab] = useState<"runs" | "stats">("runs")

  const completed = executions.filter(e => e.status === "completed")
  const failed = executions.filter(e => e.status === "failed")
  const running = executions.filter(e => e.status === "running" || e.status === "pending")
  const successRate = executions.length > 0 ? Math.round((completed.length / executions.length) * 100) : null

  // Compute total nodes executed and avg duration
  let totalNodes = 0
  let totalDuration = 0
  for (const ex of completed) {
    const nr: NodeResult[] = (ex.output_data as { node_results?: NodeResult[] })?.node_results ?? (ex.node_results as NodeResult[]) ?? []
    totalNodes += nr.length
    totalDuration += nr.reduce((s, n) => s + (n.duration_ms ?? 0), 0)
  }
  const avgDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : null

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Workflow Inspector</h3>
          {running.length > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </div>
        <div className="flex gap-1">
          {(["runs", "stats"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-6 px-3 rounded-md text-xs font-medium capitalize transition-colors",
                tab === t ? "bg-violet-600 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "stats" && (
          <div className="space-y-3">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Total Runs", value: String(executions.length), icon: Activity, color: "text-violet-400" },
                { label: "Success Rate", value: successRate !== null ? `${successRate}%` : "—", icon: CheckCircle, color: "text-emerald-400" },
                { label: "Failed", value: String(failed.length), icon: XCircle, color: "text-red-400" },
                { label: "Avg Duration", value: avgDuration !== null ? formatDuration(avgDuration) : "—", icon: Timer, color: "text-blue-400" },
                { label: "Nodes Executed", value: String(totalNodes), icon: Cpu, color: "text-amber-400" },
                { label: "Active Runs", value: String(running.length), icon: GitBranch, color: "text-teal-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={cn("h-3 w-3", color)} />
                    <span className="text-[9px] text-white/30 uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            {executions.length === 0 && (
              <div className="py-8 text-center">
                <Info className="h-8 w-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs text-white/30">No executions yet</p>
              </div>
            )}
          </div>
        )}

        {tab === "runs" && (
          <div className="space-y-2">
            {running.length > 0 && (
              <>
                <p className="text-[9px] text-amber-400/70 uppercase tracking-wide px-1">Running</p>
                {running.map(e => <ExecutionRow key={e.id} execution={e} />)}
              </>
            )}
            {executions.filter(e => e.status !== "running" && e.status !== "pending").length > 0 && (
              <>
                {running.length > 0 && <div className="border-t border-white/[0.05] my-2" />}
                <p className="text-[9px] text-white/30 uppercase tracking-wide px-1">History</p>
                {executions
                  .filter(e => e.status !== "running" && e.status !== "pending")
                  .slice(0, 15)
                  .map(e => <ExecutionRow key={e.id} execution={e} />)}
              </>
            )}
            {executions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-10 w-10 text-white/10 mb-3" />
                <p className="text-sm text-white/30">No executions yet</p>
                <p className="text-xs text-white/20 mt-1">Run a workflow to see results here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {executions.length > 0 && (
        <div className="px-3 py-2 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-white/20" />
            <p className="text-[9px] text-white/20">Showing last {Math.min(executions.length, 15)} runs</p>
          </div>
        </div>
      )}
    </div>
  )
}
