"use client"

import { useState } from "react"
import {
  FileText, Clock, Check, AlertTriangle, Copy, ChevronRight,
  Calendar, Hash, GitBranch, Sparkles, ExternalLink, X
} from "lucide-react"
import type { WorkflowExpansion } from "./WorkflowCard"

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

interface DetailInspectorProps {
  workflow: WorkflowExpansion | null
  steps: ExpansionStep[]
  generatedFiles: Record<string, string>
  newFiles: Record<string, boolean> // Tracks which files are newly generated
  loading: boolean
  errorMessage?: string | null
  onClose?: () => void
}

export function DetailInspector({
  workflow,
  steps,
  generatedFiles,
  newFiles,
  loading,
  errorMessage,
  onClose,
}: DetailInspectorProps) {
  const [viewingFile, setViewingFile] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-zinc-700" />
        </div>
        <p className="text-sm text-zinc-500 font-medium">Select a workflow</p>
        <p className="text-xs text-zinc-600 mt-1">
          View details, files, and pipeline steps
        </p>
      </div>
    )
  }

  // Display error message if there's one
  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-medium text-red-400 mb-2">
          Unable to Load Workflow Details
        </p>
        <p className="text-xs text-red-400/80 max-w-md">
          {errorMessage}
        </p>
        <p className="text-xs text-zinc-500 mt-4">
          Please try again or select a different workflow
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-black transition-all"
            style={{
              background: "linear-gradient(135deg, #CA8A04, #EAB308)",
              boxShadow: "0 0 20px rgba(202,138,4,0.25)",
            }}
          >
            Close
          </button>
        )}
      </div>
    )
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (date: string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const fileKeys = Object.keys(generatedFiles)

  return (
    <div className="h-full overflow-y-auto scrollbar-architect">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-5 space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-white mb-1">{workflow.title}</h3>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {workflow.description && (
              <p className="text-xs text-zinc-500 leading-relaxed">
                {workflow.description}
              </p>
            )}
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar className="w-3 h-3 text-zinc-600" />
                <span className="text-[9px] text-zinc-600 uppercase">Created</span>
              </div>
              <span className="text-[11px] text-zinc-300 font-mono">
                {formatDate(workflow.created_at)}
              </span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Hash className="w-3 h-3 text-zinc-600" />
                <span className="text-[9px] text-zinc-600 uppercase">Files</span>
              </div>
              <span className="text-[11px] text-zinc-300 font-mono">
                {workflow.file_count || fileKeys.length}
              </span>
            </div>
            {workflow.completed_at && (
              <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Check className="w-3 h-3 text-zinc-600" />
                  <span className="text-[9px] text-zinc-600 uppercase">Completed</span>
                </div>
                <span className="text-[11px] text-zinc-300 font-mono">
                  {formatDate(workflow.completed_at)}
                </span>
              </div>
            )}
            {workflow.github_repo_url && (
              <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <GitBranch className="w-3 h-3 text-zinc-600" />
                  <span className="text-[9px] text-zinc-600 uppercase">Repo</span>
                </div>
                <a
                  href={workflow.github_repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 font-mono flex items-center gap-1 hover:text-amber-300"
                >
                  View <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
          </div>

          {/* Pipeline steps */}
          {steps.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                Pipeline Steps
              </h4>
              <div className="space-y-1">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                  >
                    {step.status === "completed" ? (
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                    ) : step.status === "running" ? (
                      <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : step.status === "failed" ? (
                      <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-[11px] font-mono ${
                        step.status === "completed"
                          ? "text-green-300"
                          : step.status === "running"
                          ? "text-amber-300"
                          : step.status === "failed"
                          ? "text-red-300"
                          : "text-zinc-500"
                      }`}
                    >
                      {step.step_name.replace(/_/g, " ")}
                    </span>
                    {step.status === "completed" && (
                      <span className="ml-auto text-[9px] text-green-700 font-mono">
                        done
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated files */}
          {fileKeys.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                Generated Files
              </h4>
              <div className="space-y-1">
                {fileKeys.map((filename) => {
                  const isNew = !!newFiles?.[filename];
                  return (
                    <div key={filename}>
                      <button
                        onClick={() =>
                          setViewingFile(
                            viewingFile === filename ? null : filename
                          )
                        }
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                          viewingFile === filename
                            ? "bg-amber-500/8 border border-amber-500/20"
                            : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]"
                        }`}
                      >
                        <FileText
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            viewingFile === filename
                              ? "text-amber-400"
                              : "text-zinc-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-mono text-zinc-300 text-left truncate">
                            {filename}
                          </span>
                          {isNew && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                              NEW
                            </span>
                          )}
                        </div>
                        <ChevronRight
                          className={`ml-auto w-3 h-3 text-zinc-600 transition-transform ${
                            viewingFile === filename ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {viewingFile === filename && (
                        <div className="mt-1 rounded-lg border border-white/[0.06] bg-zinc-900/60 overflow-hidden wf-file-reveal">
                          <div className="px-3 py-1.5 border-b border-white/[0.04] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-zinc-600 font-mono">
                                {generatedFiles[filename].split(/\s+/).length} words
                              </span>
                              <span className="text-[9px] text-zinc-500 font-mono">
                                ~{Math.ceil(generatedFiles[filename].length / 1800)} pages
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                handleCopy(generatedFiles[filename])
                              }
                              className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-white transition-all"
                            >
                              {copied ? (
                                <Check className="w-2.5 h-2.5 text-green-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                              {copied ? "Copied" : "Copy"}
                            </button>
                          </div>
                          {/* Full file content - removed truncation to show complete file */}
                          <pre className="p-3 text-[10px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto scrollbar-architect">
                            {generatedFiles[filename]}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {workflow.error_message && (
            <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
              <p className="text-[10px] text-red-400 font-mono leading-relaxed">
                {workflow.error_message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
