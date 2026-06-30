"use client"

import { useEffect, useState, useCallback } from "react"
import { X, Terminal, Github, ExternalLink, Download, Copy, Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MarketplaceCardData } from "./MarketplaceCard"

interface InstallModalProps {
  listing: MarketplaceCardData & {
    install_commands?: { platform: string; command: string; description?: string | null }[]
    github_url?: string | null
  }
  open: boolean
  onClose: () => void
}

const PLATFORM_LABELS: Record<string, string> = {
  CURSOR: "Cursor",
  CLAUDE_CODE: "Claude Code",
  CLAUDE_DESKTOP: "Claude Desktop",
  WINDSURF: "Windsurf",
  VSCODE: "VS Code",
  GITHUB_COPILOT: "GitHub Copilot",
  CLI: "CLI",
  NPM: "npm",
  MANUAL: "Manual",
  OTHER: "Other",
}

const TYPE_GRADIENT: Record<string, string> = {
  "CLAUDE_SKILL": "from-purple-900/60 to-transparent",
  "CURSOR_RULE": "from-blue-900/60 to-transparent",
  "WINDSURF_WORKFLOW": "from-emerald-900/60 to-transparent",
  "MCP_SERVER": "from-orange-900/60 to-transparent",
  "AI_AGENT": "from-sky-900/60 to-transparent",
  "PROMPT_PACK": "from-violet-900/60 to-transparent",
}

export function InstallModal({ listing, open, onClose }: InstallModalProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [activeCmd, setActiveCmd] = useState(0)

  const commands = listing.install_commands ?? []
  const type = (listing.type ?? "").toUpperCase().replace(/ /g, "_")
  const gradient = TYPE_GRADIENT[type] ?? "from-purple-900/60 to-transparent"

  const handleCopy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Install ${listing.title}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#0e0e18] border border-white/10 shadow-2xl flex flex-col">
        {/* Header gradient band */}
        <div className={cn("absolute inset-x-0 top-0 h-32 bg-gradient-to-b opacity-60 pointer-events-none rounded-t-2xl", gradient)} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title area */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-start gap-3 pr-8">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
              <Terminal className="h-5 w-5 text-white/70" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-white text-base leading-tight line-clamp-2">
                {listing.seo_title || listing.title}
              </h2>
              {listing.creator?.name && (
                <p className="text-xs text-white/40 mt-0.5">by {listing.creator.name}</p>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 mt-3 text-xs text-white/40">
            {(listing.downloads ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {(listing.downloads ?? 0).toLocaleString()}
              </span>
            )}
            {(listing.average_rating ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {(listing.average_rating ?? 0).toFixed(1)}
              </span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/30 uppercase text-[10px] tracking-wider">
              {(listing.type ?? "Skill").replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Install commands */}
          {commands.length > 0 ? (
            <div className="space-y-3">
              {/* Platform tabs */}
              {commands.length > 1 && (
                <div className="flex gap-1.5 flex-wrap">
                  {commands.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveCmd(i)}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                        activeCmd === i
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-transparent border-white/[0.07] text-white/40 hover:text-white/70"
                      )}
                    >
                      {PLATFORM_LABELS[cmd.platform] ?? cmd.platform}
                    </button>
                  ))}
                </div>
              )}

              {/* Command block */}
              {commands[activeCmd] && (
                <div className="rounded-xl bg-black/50 border border-white/[0.07] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07]">
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">
                      {commands.length === 1
                        ? (PLATFORM_LABELS[commands[0].platform] ?? commands[0].platform)
                        : "Command"}
                    </span>
                    <button
                      onClick={() => handleCopy(commands[activeCmd].command, `cmd-${activeCmd}`)}
                      className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
                    >
                      {copied === `cmd-${activeCmd}` ? (
                        <><Check className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                      ) : (
                        <><Copy className="h-3 w-3" />Copy</>
                      )}
                    </button>
                  </div>
                  <pre className="px-4 py-3 text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {commands[activeCmd].command}
                  </pre>
                  {commands[activeCmd].description && (
                    <p className="px-4 pb-3 text-xs text-white/40">{commands[activeCmd].description}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-black/30 border border-white/[0.06] px-4 py-5 text-center">
              <Terminal className="h-5 w-5 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">No install commands — view the full listing for details.</p>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              asChild
              className="h-9 text-sm"
            >
              <a href={`/listing/${listing.id}`}>
                View Full Details
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
            {listing.github_url ? (
              <Button
                variant="outline"
                className="h-9 text-sm"
                asChild
              >
                <a href={listing.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-3.5 w-3.5 mr-1.5" />
                  GitHub
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-9 text-sm"
                asChild
              >
                <a href={`/listing/${listing.id}#listing-tab-install`}>
                  Install Guide
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
