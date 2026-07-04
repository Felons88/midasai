"use client"

import { useState } from "react"
import { FolderSearch, Play, Plus, Trash2, ChevronDown, ChevronRight, Loader2, CheckCircle, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { NexusDirectory, NexusItemType, OptimizationResult } from "@/lib/nexus/types"

const TYPE_CONFIG: Record<NexusItemType, { color: string; bg: string; label: string }> = {
  skill: { color: "text-violet-400", bg: "bg-violet-500/10", label: "Skill" },
  model: { color: "text-pink-400", bg: "bg-pink-500/10", label: "Model" },
  workflow: { color: "text-blue-400", bg: "bg-blue-500/10", label: "Workflow" },
  agent: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Agent" },
}

interface DirectoryOptimizerProps {
  directories: NexusDirectory[]
  onRefresh: () => void
  onDelete: (id: string) => Promise<void>
}

export function DirectoryOptimizer({ directories, onRefresh, onDelete }: DirectoryOptimizerProps) {
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  const [directoryPath, setDirectoryPath] = useState("")
  const [filterType, setFilterType] = useState<NexusItemType | "all">("all")
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = filterType === "all" ? directories : directories.filter((d) => d.type === filterType)

  async function runOptimize() {
    if (!directoryPath.trim()) return
    setOptimizing(true)
    setOptimizationResult(null)
    try {
      const res = await fetch("/api/nexus/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: directoryPath }),
      })
      const data = await res.json()
      if (data.result) {
        setOptimizationResult(data.result)
        onRefresh()
      }
    } finally {
      setOptimizing(false)
    }
  }

  const typeCounts = directories.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Optimizer Panel */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
            <FolderSearch className="h-4.5 w-4.5 text-white/60" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Directory Optimizer</h3>
            <p className="text-xs text-white/40">Scan and classify files automatically</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter directory path (e.g. /my/project)"
            value={directoryPath}
            onChange={(e) => setDirectoryPath(e.target.value)}
            className="bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/30 flex-1"
            onKeyDown={(e) => e.key === "Enter" && runOptimize()}
          />
          <Button onClick={runOptimize} disabled={optimizing || !directoryPath.trim()}>
            {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>

        {optimizationResult && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Optimization Complete</span>
              <span className="text-xs text-emerald-400/60 ml-auto">{optimizationResult.duration_ms}ms</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-white">{optimizationResult.total_files}</p>
                <p className="text-xs text-white/40">Files Scanned</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{optimizationResult.classified}</p>
                <p className="text-xs text-white/40">Classified</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{optimizationResult.directories_created}</p>
                <p className="text-xs text-white/40">Added</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {optimizationResult.classifications.map((c, i) => {
                const cfg = TYPE_CONFIG[c.type]
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", cfg.bg, cfg.color)}>{cfg.label}</span>
                    <span className="text-white/50 truncate flex-1">{c.file_path.split("/").pop()}</span>
                    <span className="text-white/30">{Math.round(c.confidence * 100)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Type Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(["all", "skill", "model", "workflow", "agent"] as const).map((type) => {
          if (type === "all") {
            return (
              <button
                key="all"
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  filterType === "all" ? "border-white/20 bg-white/[0.04]" : "border-white/[0.06] bg-white/[0.01] hover:border-white/10"
                )}
                onClick={() => setFilterType("all")}
              >
                <p className="text-lg font-bold text-white">{directories.length}</p>
                <p className="text-xs text-white/40">All</p>
              </button>
            )
          }
          const cfg = TYPE_CONFIG[type]
          return (
            <button
              key={type}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                filterType === type ? "border-white/20 bg-white/[0.04]" : "border-white/[0.06] bg-white/[0.01] hover:border-white/10"
              )}
              onClick={() => setFilterType(type)}
            >
              <p className={cn("text-lg font-bold", cfg.color)}>{typeCounts[type] ?? 0}</p>
              <p className="text-xs text-white/40">{cfg.label}s</p>
            </button>
          )
        })}
      </div>

      {/* Directory List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] py-14 text-center">
          <Folder className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No directories yet</p>
          <p className="text-xs text-white/20 mt-1">Run the optimizer or add manually</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((dir) => {
            const cfg = TYPE_CONFIG[dir.type]
            const isExp = expanded === dir.id
            const meta = dir.metadata as Record<string, unknown>

            return (
              <div key={dir.id} className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpanded(isExp ? null : dir.id)} className="text-white/30 hover:text-white/60 transition-colors">
                    {isExp ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  <Folder className="h-4 w-4 text-white/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{dir.name}</p>
                    <p className="text-xs text-white/30 truncate">{dir.path}</p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0", cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                  <button
                    className="text-white/20 hover:text-red-400 transition-colors ml-1"
                    onClick={() => onDelete(dir.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isExp && (
                  <div className="px-4 pb-3 border-t border-white/[0.04] pt-3">
                    <p className="text-xs text-white/40 mb-2">Metadata</p>
                    <div className="rounded-lg bg-white/[0.02] px-3 py-2 font-mono text-xs text-white/50">
                      {JSON.stringify(meta, null, 2)}
                    </div>
                    <p className="text-xs text-white/30 mt-2">
                      Created {new Date(dir.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
