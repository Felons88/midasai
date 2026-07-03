"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Github, Copy, Check, ExternalLink, X, FileText, Sparkles, Zap, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SkillModalProps {
  listingId: string
  listingTitle: string
  onClose: () => void
}

interface SkillPromptData {
  githubUrl: string
  skillMdUrl: string
  prompt: string | null
  skillMdMissing: boolean
}

interface ProgressState {
  percent: number
  message: string
  eta: number
}

export function SkillModal({ listingId, listingTitle, onClose }: SkillModalProps) {
  const [data, setData] = useState<SkillPromptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<ProgressState>({ percent: 0, message: "Initializing...", eta: 25 })
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [refreshed, setRefreshed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const es = new EventSource(`/api/listings/${listingId}/skill-prompt`)

    es.addEventListener("progress", (e: MessageEvent) => {
      const d = JSON.parse(e.data)
      setProgress({ percent: d.percent ?? 0, message: d.message ?? "Generating...", eta: d.eta ?? 0 })
      setLoading(true)
    })

    es.addEventListener("complete", (e: MessageEvent) => {
      const d = JSON.parse(e.data)
      loadedRef.current = true
      setData(d)
      setLoading(false)
      // Keep the connection open for a potential background refresh event.
    })

    es.addEventListener("refreshed", (e: MessageEvent) => {
      const d = JSON.parse(e.data)
      loadedRef.current = true
      setData(d)
      setRefreshed(true)
      setLoading(false)
      es.close()
    })

    es.addEventListener("error", (e: MessageEvent) => {
      const d = JSON.parse(e.data)
      setError(d.error ?? "Failed to load skill info")
      setLoading(false)
      es.close()
    })

    es.onerror = () => {
      // A fresh cache response closes the stream immediately, which triggers onerror.
      // If we already have data, treat it as a normal close instead of an error.
      if (loadedRef.current) {
        es.close()
        return
      }
      setError("Connection lost. Please try again.")
      setLoading(false)
      es.close()
    }

    return () => es.close()
  }, [listingId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const handleCopy = async () => {
    if (!data?.prompt) return
    await navigator.clipboard.writeText(data.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #13131a 0%, #0d0d14 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cta/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-cta/15 border border-cta/25 flex items-center justify-center">
              <Github className="h-4.5 w-4.5 text-cta" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-widest">Claude Code Skill</p>
              <h2 className="text-base font-bold text-text-primary leading-tight truncate">{listingTitle}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-white/8 transition-all"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-14">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-cta/20 border-t-cta animate-spin" />
                <Zap className="absolute inset-0 m-auto h-5 w-5 text-cta" />
              </div>
              <div className="text-center space-y-3 w-full max-w-xs">
                <p className="text-sm font-medium text-text-primary transition-all">{progress.message}</p>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cta to-cta-light transition-all duration-700"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="text-xs text-text-tertiary">
                  Generating prompt to install <span className="text-text-primary font-medium">{listingTitle}</span>
                  {" "}• {progress.percent}% • ETA {progress.eta}s
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300 break-all leading-relaxed">{error}</p>
              </div>
              {data?.githubUrl && (
                <button
                  onClick={() => window.open(data.githubUrl, "_blank", "noopener,noreferrer")}
                  className="inline-flex items-center gap-1.5 text-sm text-cta hover:underline"
                >
                  <Github className="h-3.5 w-3.5" /> Open on GitHub anyway
                </button>
              )}
            </div>
          )}

          {/* Success */}
          {!loading && !error && data && (
            <>
              {/* Prompt box */}
              {data.prompt && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-cta/15 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-cta" />
                    </div>
                    <span className="text-xs font-bold text-cta uppercase tracking-widest">AI Install Prompt</span>
                    {refreshed && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 ml-auto">
                        <RefreshCw className="h-3 w-3" /> Updated just now
                      </span>
                    )}
                    <span className={cn("text-[10px] text-text-tertiary", refreshed ? "" : "ml-auto")}>
                      Paste into Claude Code · VS Code · Cursor · Windsurf
                    </span>
                  </div>
                  <div
                    className="relative rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <pre className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed p-4 max-h-72 overflow-y-auto font-mono">
                      {data.prompt}
                    </pre>
                    {/* subtle gradient fade at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                      style={{ background: "linear-gradient(to top, rgba(13,13,20,0.9), transparent)" }} />
                  </div>
                </div>
              )}

              {/* SKILL.md missing notice */}
              {data.skillMdMissing && (
                <div className="flex items-center gap-2.5 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                  <FileText className="h-4 w-4 text-text-tertiary shrink-0" />
                  <p className="text-xs text-text-tertiary">No SKILL.md found — prompt generated from listing info only.</p>
                </div>
              )}

              {/* SKILL.md source link */}
              {!data.skillMdMissing && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-text-tertiary/60" />
                  <span className="shrink-0">Source:</span>
                  <a
                    href={data.skillMdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-cta transition-colors"
                  >
                    {data.skillMdUrl}
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && data && (
          <div className="px-6 pb-6 pt-4 border-t border-white/8 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 h-11 border-white/12 hover:bg-white/6 text-sm"
              onClick={() => window.open(data.githubUrl, "_blank", "noopener,noreferrer")}
            >
              <Github className="h-4 w-4" />
              Go to GitHub
              <ExternalLink className="h-3 w-3 opacity-40 ml-auto" />
            </Button>

            {data.prompt && (
              <Button
                className={cn(
                  "flex-1 gap-2 h-11 text-sm font-semibold transition-all duration-200",
                  copied
                    ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
                    : "shadow-glow"
                )}
                onClick={handleCopy}
              >
                {copied ? (
                  <><Check className="h-4 w-4" /> Copied to clipboard!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy Install Prompt</>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}
