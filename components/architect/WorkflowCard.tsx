"use client"

import { useState, useEffect } from "react"
import {
  Sparkles, Clock, Play, Brain, FileText, Check, AlertTriangle,
  Archive, Trash2, ChevronRight, Loader2, MoreHorizontal, Import,
  ScanSearch, Rocket
} from "lucide-react"

export type WorkflowStatus =
  | "DRAFT"
  | "IMPORTED"
  | "ANALYZING"
  | "ANALYZED"
  | "INITIALIZING"
  | "RUNNING"
  | "PROCESSING_AI"
  | "GENERATING_FILES"
  | "COMPLETED"
  | "FAILED"
  | "ARCHIVED"

export interface WorkflowExpansion {
  id: string
  title: string
  description: string | null
  status: WorkflowStatus
  pipeline_stage: string | null
  pipeline_progress: number
  file_count: number
  github_repo_url: string | null
  error_message: string | null
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  archived_at: string | null
  session_id: string | null
  expansion_config?: Record<string, unknown> | null
}

const STATUS_CONFIG: Record<
  WorkflowStatus,
  {
    label: string
    icon: typeof Clock
    color: string
    bg: string
    border: string
    animation: string
  }
> = {
  DRAFT: {
    label: "Draft",
    icon: FileText,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
    animation: "wf-idle-shimmer",
  },
  IMPORTED: {
    label: "Imported",
    icon: Import,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    animation: "wf-idle-shimmer",
  },
  ANALYZING: {
    label: "Analyzing",
    icon: ScanSearch,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/40",
    animation: "wf-ai-processing",
  },
  ANALYZED: {
    label: "Ready",
    icon: Rocket,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    animation: "wf-completed",
  },
  INITIALIZING: {
    label: "Initializing",
    icon: Loader2,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    animation: "wf-initializing",
  },
  RUNNING: {
    label: "Running",
    icon: Play,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    animation: "wf-running",
  },
  PROCESSING_AI: {
    label: "AI Processing",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/40",
    animation: "wf-ai-processing",
  },
  GENERATING_FILES: {
    label: "Generating Files",
    icon: FileText,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    animation: "wf-generating",
  },
  COMPLETED: {
    label: "Completed",
    icon: Check,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/40",
    animation: "wf-completed",
  },
  FAILED: {
    label: "Failed",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    animation: "wf-failed",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    color: "text-zinc-500",
    bg: "bg-zinc-800/40",
    border: "border-zinc-700/30",
    animation: "",
  },
}

interface WorkflowCardProps {
  workflow: WorkflowExpansion
  onExpand: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  isSelected: boolean
  isDeleting: boolean
  isArchiving: boolean
  // New props for file tracking and scoring
  newFilesCount?: number
  combinedScore?: number
}

export function WorkflowCard({
  workflow,
  onExpand,
  onArchive,
  onDelete,
  onSelect,
  isSelected,
  isDeleting,
  isArchiving,
  newFilesCount = 0,
  combinedScore = 0,
}: WorkflowCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const config = STATUS_CONFIG[workflow.status]
  const StatusIcon = config.icon
  const isActive = ["INITIALIZING", "RUNNING", "PROCESSING_AI", "GENERATING_FILES", "ANALYZING"].includes(
    workflow.status
  )
  const isAnalyzing = workflow.status === "ANALYZING"
  const isAnalyzed = workflow.status === "ANALYZED"

  // Get real progress from workflow config if available
  const statusUpdate = workflow.expansion_config?.last_update as { status: string } | undefined
  const pipelineProgress = workflow.expansion_config?.pipeline_progress as number | undefined
  const pipelineStage = workflow.expansion_config?.pipeline_stage as string | undefined

  return (
    <div
      onClick={() => onSelect(workflow.id)}
      className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer ${
        config.animation
      } ${
        isSelected
          ? `${config.border} ${config.bg} shadow-lg`
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
      } ${isDeleting ? "wf-delete-fracture" : ""} ${isArchiving ? "wf-archive-seal" : ""}`}
      style={{
        transform: isSelected ? "translateY(-2px)" : undefined,
      }}
    >
      {/* Active glow effect */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none wf-glow-pulse"
          style={{ boxShadow: `0 0 30px ${workflow.status === "PROCESSING_AI" ? "rgba(168,85,247,0.3)" : "rgba(202,138,4,0.3)"}` }}
        />
      )}

      {/* Card content */}
      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} border ${config.border}`}
            >
              <StatusIcon
                className={`w-5 h-5 ${config.color} ${
                  isActive ? "animate-spin" : ""
                } ${workflow.status === "COMPLETED" ? "wf-check-draw" : ""}`}
                style={isActive ? { animationDuration: "2s" } : undefined}
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {workflow.title}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Last updated at {new Date(workflow.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Context menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl z-50 py-1.5 animate-scale-in"
                onMouseLeave={() => setShowMenu(false)}
              >
                {(workflow.status === "COMPLETED" || workflow.status === "IMPORTED") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onArchive(workflow.id)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                  </button>
                )}
                {["DRAFT", "FAILED", "IMPORTED"].includes(workflow.status) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(workflow.id)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {workflow.description && (
          <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
            {workflow.description}
          </p>
        )}

        {/* Status badge + progress */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${config.bg} ${config.border} ${config.color} border`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "animate-pulse" : ""
              }`}
              style={{
                backgroundColor:
                  workflow.status === "COMPLETED"
                    ? "#4ade80"
                    : workflow.status === "FAILED"
                    ? "#f87171"
                    : workflow.status === "IMPORTED"
                    ? "#fbbf24"
                    : workflow.status === "PROCESSING_AI"
                    ? "#c084fc"
                    : isActive
                    ? "#fbbf24"
                    : "#71717a",
              }}
            />
            {config.label}
          </div>

          <div className="flex items-center gap-2">
            {workflow.file_count > 0 && (
              <span className="text-[10px] text-zinc-600 font-mono">
                {workflow.file_count} files
              </span>
            )}
            {/* New files indicator */}
            {newFilesCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                +{newFilesCount} new
              </span>
            )}
            {/* Quality score for completed workflows */}
            {combinedScore > 0 && workflow.status === "COMPLETED" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Check className="w-2.5 h-2.5" />
                {combinedScore}%
              </span>
            )}
          </div>
        </div>

        {/* New files indicator - shown for completed workflows with new files */}
        {newFilesCount > 0 && (
          <div className="mt-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-xs font-semibold text-green-300">New Files Added</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-green-400 bg-green-500/30 px-2 py-1 rounded-full">
                  +{newFilesCount} files
                </span>
                {combinedScore > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Check className="w-3 h-3" />
                    Quality: {combinedScore}%
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              This expansion added {newFilesCount} new file{newFilesCount !== 1 ? 's' : ''} to your project, improving intelligence quality and expanding coverage.
            </p>
          </div>
        )}

        {/* Progress bar for active states */}
        {isActive && pipelineProgress !== null && pipelineProgress > 0 && (
          <div className="mt-3">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 wf-progress-wave"
                style={{
                  width: `${pipelineProgress}%`,
                  background:
                    workflow.status === "PROCESSING_AI"
                      ? "linear-gradient(90deg, #a855f7, #7c3aed)"
                      : workflow.status === "GENERATING_FILES"
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : "linear-gradient(90deg, #f59e0b, #d97706)",
                }}
              />
            </div>
            {pipelineStage && (
              <p className="text-[10px] text-zinc-600 mt-1.5 font-mono">
                {pipelineStage.replace(/_/g, " ").toLowerCase()}
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {workflow.status === "FAILED" && workflow.error_message && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
            <p className="text-[10px] text-red-400 line-clamp-2 font-mono">
              {workflow.error_message}
            </p>
          </div>
        )}

        {/* Analyzing state — show real progress */}
        {workflow.status === "ANALYZING" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
              <div className="flex items-center gap-2">
                <ScanSearch className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-cyan-300">Analyzing project files...</span>
              </div>
              {pipelineProgress !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-cyan-400/80 tabular-nums">{pipelineProgress}%</span>
                </div>
              )}
            </div>
            <p className="text-[9px] text-zinc-600 text-center">Progress updated from backend</p>
          </div>
        )}

        {/* Analyzed — Ready to expand with cool UI */}
        {isAnalyzed && (
          <div className="mt-4 space-y-2">
            {statusUpdate && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <span className="text-[10px] text-emerald-300">Status Update</span>
                <span className="text-xs font-black text-emerald-400 tabular-nums">{statusUpdate.status}</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onExpand(workflow.id)
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-black transition-all wf-expand-btn relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                boxShadow: "0 0 25px rgba(16,185,129,0.3), 0 0 60px rgba(16,185,129,0.1)",
              }}
            >
              <Rocket className="w-4 h-4" />
              Ready — Start Expanding
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Expand button for imported workflows — now triggers analysis first */}
        {workflow.status === "IMPORTED" && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExpand(workflow.id)
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-black transition-all wf-expand-btn"
            style={{
              background: "linear-gradient(135deg, #CA8A04, #EAB308)",
              boxShadow: "0 0 20px rgba(202,138,4,0.25)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze & Expand
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Expand button for completed workflows */}
        {workflow.status === "COMPLETED" && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExpand(workflow.id)
            }}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-black transition-all wf-expand-btn"
            style={{
              background: "linear-gradient(135deg, #CA8A04, #EAB308)",
              boxShadow: "0 0 20px rgba(202,138,4,0.25)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Expand Workflow
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Retry for failed */}
        {workflow.status === "FAILED" && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExpand(workflow.id)
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-red-300 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Retry Expansion
          </button>
        )}

        {/* Draft expand */}
        {workflow.status === "DRAFT" && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExpand(workflow.id)
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-amber-300 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Start Expansion
          </button>
        )}
      </div>
    </div>
  )
}

