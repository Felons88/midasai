"use client"

import type { WorkflowExpansion } from "./WorkflowCard"

interface WorkflowTimelineProps {
  workflows: WorkflowExpansion[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const STATUS_COLORS: Record<string, { dot: string; line: string; glow: string }> = {
  DRAFT: { dot: "bg-zinc-500", line: "bg-zinc-700", glow: "" },
  INITIALIZING: { dot: "bg-blue-400", line: "bg-blue-500/30", glow: "shadow-blue-400/30" },
  RUNNING: { dot: "bg-amber-400", line: "bg-amber-500/30", glow: "shadow-amber-400/30" },
  PROCESSING_AI: { dot: "bg-purple-400", line: "bg-purple-500/30", glow: "shadow-purple-400/30" },
  GENERATING_FILES: { dot: "bg-cyan-400", line: "bg-cyan-500/30", glow: "shadow-cyan-400/30" },
  COMPLETED: { dot: "bg-green-400", line: "bg-green-500/30", glow: "shadow-green-400/30" },
  FAILED: { dot: "bg-red-400", line: "bg-red-500/30", glow: "shadow-red-400/30" },
  ARCHIVED: { dot: "bg-zinc-600", line: "bg-zinc-700", glow: "" },
}

export function WorkflowTimeline({
  workflows,
  selectedId,
  onSelect,
}: WorkflowTimelineProps) {
  return (
    <div className="relative flex flex-col items-center py-4">
      {/* Vertical rail */}
      <div className="absolute top-0 bottom-0 w-px wf-timeline-rail" />

      {workflows.map((wf, idx) => {
        const colors = STATUS_COLORS[wf.status] || STATUS_COLORS.DRAFT
        const isSelected = selectedId === wf.id
        const isActive = [
          "INITIALIZING",
          "RUNNING",
          "PROCESSING_AI",
          "GENERATING_FILES",
        ].includes(wf.status)

        return (
          <div
            key={wf.id}
            className="relative flex items-center w-full group"
            style={{
              animationDelay: `${idx * 80}ms`,
            }}
          >
            {/* Timeline dot */}
            <button
              onClick={() => onSelect(wf.id)}
              className={`relative z-10 flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-300 cursor-pointer
                ${colors.dot} 
                ${isSelected ? "border-white scale-125" : "border-zinc-800"}
                ${isActive ? "animate-pulse" : ""}
                ${colors.glow ? `shadow-lg ${colors.glow}` : ""}
              `}
              title={wf.title}
            >
              {/* Inner glow for active */}
              {isActive && (
                <div
                  className={`absolute inset-[-4px] rounded-full ${colors.dot} opacity-20`}
                  style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }}
                />
              )}
            </button>

            {/* Connector line to next */}
            {idx < workflows.length - 1 && (
              <div
                className={`absolute left-[7px] top-4 w-0.5 h-8 ${colors.line} transition-all`}
              />
            )}

            {/* Mini label */}
            <div
              className={`ml-3 py-2 flex items-center gap-2 cursor-pointer transition-all ${
                isSelected ? "opacity-100" : "opacity-60 hover:opacity-90"
              }`}
              onClick={() => onSelect(wf.id)}
            >
              <span
                className={`text-[10px] font-semibold truncate max-w-[100px] ${
                  isSelected ? "text-white" : "text-zinc-400"
                }`}
              >
                {wf.title}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
