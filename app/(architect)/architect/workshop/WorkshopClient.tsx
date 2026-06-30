"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Sparkles, Loader2, Search,
  Filter, LayoutGrid, Clock, Hammer
} from "lucide-react"
import { WorkflowCard, type WorkflowExpansion, type WorkflowStatus } from "@/components/architect/WorkflowCard"
import { WorkflowTimeline } from "@/components/architect/WorkflowTimeline"
import { DetailInspector } from "@/components/architect/DetailInspector"
import { ExpandOverlay } from "@/components/architect/ExpandOverlay"

type FilterStatus = "ALL" | WorkflowStatus

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Drafts" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "ARCHIVED", label: "Archived" },
]

interface ExpansionStep {
  id: string
  step_name: string
  step_order: number
  status: string
  started_at: string | null
  completed_at: string | null
  output: Record<string, unknown> | null
  error: string | null
}

export function WorkshopClient() {
  const [workflows, setWorkflows] = useState<WorkflowExpansion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailSteps, setDetailSteps] = useState<ExpansionStep[]>([])
  const [detailFiles, setDetailFiles] = useState<Record<string, string>>({})
  const [expandingId, setExpandingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setWorkflows(data.workflows ?? [])
    } catch (e) {
      console.error("Failed to fetch workflows:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  // Poll for ANALYZING workflows to detect when they become ANALYZED
  useEffect(() => {
    const hasAnalyzing = workflows.some((w) => w.status === "ANALYZING")
    if (hasAnalyzing && !pollRef.current) {
      pollRef.current = setInterval(() => {
        fetchWorkflows()
      }, 5000) // Poll every 5 seconds
    } else if (!hasAnalyzing && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [workflows, fetchWorkflows])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/workflows/${id}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setDetailSteps(data.steps ?? [])
      const files = data.workflow?.generated_files
      setDetailFiles(
        files && typeof files === "object" && !Array.isArray(files) ? files : {}
      )
    } catch (e) {
      console.error("Failed to fetch detail:", e)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
  }, [selectedId, fetchDetail])

  const handleCreate = async () => {
    if (!newTitle.trim() || creating) return
    setCreating(true)
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      const data = await res.json()
      setWorkflows((prev) => [data.workflow, ...prev])
      setShowCreateModal(false)
      setNewTitle("")
      setNewDescription("")
      setSelectedId(data.workflow.id)
    } catch (e) {
      console.error("Failed to create workflow:", e)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to delete")
        setWorkflows((prev) => prev.filter((w) => w.id !== id))
        if (selectedId === id) setSelectedId(null)
      } catch (e) {
        console.error("Failed to delete:", e)
      } finally {
        setDeletingId(null)
      }
    }, 600)
  }

  const handleArchive = async (id: string) => {
    setArchivingId(id)
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/workflows/${id}/archive`, {
          method: "POST",
        })
        if (!res.ok) throw new Error("Failed to archive")
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, status: "ARCHIVED" as WorkflowStatus, archived_at: new Date().toISOString() }
              : w
          )
        )
      } catch (e) {
        console.error("Failed to archive:", e)
      } finally {
        setArchivingId(null)
      }
    }, 800)
  }

  const handleExpand = async (id: string) => {
    const wf = workflows.find((w) => w.id === id)
    if (!wf) return

    // If IMPORTED, trigger background analysis first
    if (wf.status === "IMPORTED") {
      try {
        const res = await fetch(`/api/workflows/${id}/analyze`, { method: "POST" })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          console.error("Failed to start analysis:", data.error)
          return
        }
        // Refresh to show ANALYZING state
        fetchWorkflows()
      } catch (e) {
        console.error("Failed to start analysis:", e)
      }
      return
    }

    // If ANALYZING, block — show nothing (card shows ETA)
    if (wf.status === "ANALYZING") return

    // If ANALYZED or other expandable states, open overlay
    setExpandingId(id)
  }

  const handleExpandComplete = () => {
    fetchWorkflows()
    if (selectedId) fetchDetail(selectedId)
  }

  const filtered = workflows.filter((w) => {
    if (filterStatus !== "ALL" && w.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        w.title.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const selectedWorkflow = workflows.find((w) => w.id === selectedId) ?? null

  return (
    <div className="flex-1 flex overflow-hidden bg-[#09090B] relative">
      {/* Background ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(202,138,4,0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(168,85,247,0.02) 0%, transparent 50%)",
        }}
      />

      {/* ═══════════════════════════════════
          LEFT — Timeline Rail
      ═══════════════════════════════════ */}
      <aside className="hidden xl:flex flex-col w-48 flex-shrink-0 border-r border-white/[0.06] relative z-10">
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Timeline
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 scrollbar-architect">
          {filtered.length > 0 ? (
            <WorkflowTimeline
              workflows={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <div className="py-8 text-center">
              <Clock className="w-5 h-5 text-zinc-700 mx-auto mb-2" />
              <p className="text-[10px] text-zinc-600">No workflows</p>
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════
          CENTER — Workflow Grid
      ═══════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top toolbar */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.06] flex items-center justify-between gap-4"
          style={{ background: "rgba(9,9,11,0.9)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white/[0.04] border border-white/[0.08] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/30 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-600 mr-1" />
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    filterStatus === opt.value
                      ? "bg-amber-500/15 border border-amber-500/25 text-amber-300"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black transition-all flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #CA8A04, #EAB308)",
              boxShadow: "0 0 20px rgba(202,138,4,0.2)",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Workflow
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-architect">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <p className="text-xs text-zinc-500">Loading workflows...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <LayoutGrid className="w-7 h-7 text-zinc-700" />
              </div>
              <p className="text-sm text-zinc-500 font-medium mb-1">
                {searchQuery || filterStatus !== "ALL"
                  ? "No matching workflows"
                  : "No workflows yet"}
              </p>
              <p className="text-xs text-zinc-600 mb-4">
                {searchQuery || filterStatus !== "ALL"
                  ? "Try adjusting your filters"
                  : "Generate a project in Architect, then bring it here"}
              </p>
              {!searchQuery && filterStatus === "ALL" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Create Workflow
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {filtered.map((wf) => (
                <WorkflowCard
                  key={wf.id}
                  workflow={wf}
                  onExpand={handleExpand}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onSelect={setSelectedId}
                  isSelected={selectedId === wf.id}
                  isDeleting={deletingId === wf.id}
                  isArchiving={archivingId === wf.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════
          RIGHT — Detail Inspector
      ═══════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-80 flex-shrink-0 border-l border-white/[0.06] relative z-10"
        style={{ background: "rgba(9,9,11,0.6)" }}>
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Inspector
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <DetailInspector
            workflow={selectedWorkflow}
            steps={detailSteps}
            generatedFiles={detailFiles}
            loading={detailLoading}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </aside>

      {/* ═══════════════════════════════════
          EXPAND OVERLAY
      ═══════════════════════════════════ */}
      {expandingId && (
        <ExpandOverlay
          workflowId={expandingId}
          workflowTitle={
            workflows.find((w) => w.id === expandingId)?.title ?? "Workflow"
          }
          onClose={() => {
            setExpandingId(null)
            fetchWorkflows()
          }}
          onComplete={handleExpandComplete}
        />
      )}

      {/* ═══════════════════════════════════
          CREATE MODAL
      ═══════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-amber-500/20 bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-6 animate-scale-in">
            <h2 className="text-lg font-bold text-white mb-1">
              New Workflow Expansion
            </h2>
            <p className="text-xs text-zinc-500 mb-5">
              Create a workflow to expand into a full AI project architecture
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Photo Processing Pipeline"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of the workflow..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #CA8A04, #EAB308)",
                  boxShadow: "0 0 20px rgba(202,138,4,0.2)",
                }}
              >
                {creating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
