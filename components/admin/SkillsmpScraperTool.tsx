"use client"

import { useRef, useState } from "react"
import { Download, Loader2, Globe, Square, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Keywords sent to the SkillsMP official API — covers all major categories
const ALL_KEYWORDS = [
  { slug: "claude",        label: "Claude" },
  { slug: "codex",         label: "Codex" },
  { slug: "agent",         label: "Agents" },
  { slug: "mcp",           label: "MCP" },
  { slug: "llm",           label: "LLM" },
  { slug: "prompt",        label: "Prompts" },
  { slug: "frontend",      label: "Frontend" },
  { slug: "backend",       label: "Backend" },
  { slug: "fullstack",     label: "Full Stack" },
  { slug: "typescript",    label: "TypeScript" },
  { slug: "python",        label: "Python" },
  { slug: "react",         label: "React" },
  { slug: "node",          label: "Node.js" },
  { slug: "api",           label: "API" },
  { slug: "database",      label: "Databases" },
  { slug: "testing",       label: "Testing" },
  { slug: "debugging",     label: "Debugging" },
  { slug: "security",      label: "Security" },
  { slug: "devops",        label: "DevOps" },
  { slug: "docker",        label: "Docker" },
  { slug: "kubernetes",    label: "Kubernetes" },
  { slug: "cicd",          label: "CI/CD" },
  { slug: "cloud",         label: "Cloud" },
  { slug: "terraform",     label: "Terraform" },
  { slug: "automation",    label: "Automation" },
  { slug: "productivity",  label: "Productivity" },
  { slug: "workflow",      label: "Workflows" },
  { slug: "research",      label: "Research" },
  { slug: "marketing",     label: "Marketing" },
  { slug: "writing",       label: "Writing" },
  { slug: "design",        label: "Design" },
  { slug: "documentation", label: "Docs" },
  { slug: "education",     label: "Education" },
  { slug: "finance",       label: "Finance" },
  { slug: "github",        label: "GitHub" },
  { slug: "git",           label: "Git" },
  { slug: "data",          label: "Data" },
  { slug: "mobile",        label: "Mobile" },
  { slug: "scripting",     label: "Scripting" },
]

type BatchResult = {
  slug: string
  label: string
  imported: number
  skipped: number
  errors: number
  status: "pending" | "running" | "done" | "error"
}

type TotalState = {
  imported: number
  skipped: number
  errors: number
  titles: string[]
  done: boolean
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function SkillsmpScraperTool() {
  const [busy, setBusy] = useState(false)
  const [batches, setBatches] = useState<BatchResult[]>([])
  const [totals, setTotals] = useState<TotalState | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const stopRef = useRef(false)

  // Minimal config — just dry run toggle
  const [dryRun, setDryRun] = useState(false)
  const [fetchContent, setFetchContent] = useState(false)

  function initBatches() {
    return ALL_KEYWORDS.map((kw) => ({
      slug: kw.slug,
      label: kw.label,
      imported: 0,
      skipped: 0,
      errors: 0,
      status: "pending" as const,
    }))
  }

  async function startImport() {
    stopRef.current = false
    setBusy(true)
    setGlobalError(null)
    setTotals(null)

    const initialBatches = initBatches()
    setBatches(initialBatches)

    let totalImported = 0
    let totalSkipped = 0
    let totalErrors = 0
    let allTitles: string[] = []

    for (let i = 0; i < ALL_KEYWORDS.length; i++) {
      if (stopRef.current) break

      const cat = ALL_KEYWORDS[i]

      // Mark as running
      setBatches((prev) =>
        prev.map((b) => b.slug === cat.slug ? { ...b, status: "running" } : b)
      )

      try {
        const res = await fetch("/api/admin/scrape/skillsmp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: cat.slug,
            limit: 200,          // up to 10 pages × 20 per keyword
            pages: 10,
            dry_run: dryRun,
            fetch_content: fetchContent,
          }),
        })

        const data = await res.json()

        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

        const imported = data.imported ?? 0
        const skipped = (data.skipped_duplicate ?? 0) + (data.skipped_no_content ?? 0)
        const errors = data.errors ?? 0
        const titles: string[] = data.sample_titles ?? []

        totalImported += imported
        totalSkipped += skipped
        totalErrors += errors
        allTitles = [...allTitles, ...titles].slice(-30)

        setBatches((prev) =>
          prev.map((b) =>
            b.slug === cat.slug
              ? { ...b, imported, skipped, errors, status: "done" }
              : b
          )
        )
        setTotals({ imported: totalImported, skipped: totalSkipped, errors: totalErrors, titles: allTitles, done: false })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "failed"
        console.error(`[SkillsMP] ${cat.slug} failed:`, err)
        setBatches((prev) =>
          prev.map((b) =>
            b.slug === cat.slug ? { ...b, status: "error", errors: 1 } : b
          )
        )
        setGlobalError(`${cat.label}: ${msg}`)
        totalErrors++
      }

      // Polite delay between categories
      if (i < ALL_KEYWORDS.length - 1 && !stopRef.current) await sleep(300)
    }

    setTotals((prev) => prev ? { ...prev, done: true } : { imported: totalImported, skipped: totalSkipped, errors: totalErrors, titles: allTitles, done: true })
    setBusy(false)
  }

  function stopImport() {
    stopRef.current = true
    setBusy(false)
    setTotals((prev) => prev ? { ...prev, done: true } : null)
  }

  const doneCount = batches.filter((b) => b.status === "done").length
  const runningCat = batches.find((b) => b.status === "running")

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-5 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Globe className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white">SkillsMP Scraper</h3>
          <p className="text-xs text-white/45">
            Auto-crawls all{" "}
            <a href="https://skillsmp.com" target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:underline">skillsmp.com</a>
            {" "}categories → fetches GitHub SKILL.md → tags &amp; writes to Supabase
          </p>
        </div>
        <span className="text-xs text-white/25 flex-shrink-0">{ALL_KEYWORDS.length} keywords</span>
      </div>

      <div className="p-5 space-y-5">

        {/* Description */}
        <p className="text-sm text-white/50 leading-relaxed">
          One click imports all skills across every category. Skills are automatically
          tagged with <strong className="text-white/75">category</strong>,{" "}
          <strong className="text-white/75">tech stack</strong>, and{" "}
          <strong className="text-white/75">compatibility</strong> (Claude, Cursor, Windsurf…).
          Duplicates are skipped automatically.
        </p>

        {/* Options row */}
        <div className="flex flex-wrap items-center gap-5">
          <label className="text-xs text-white/45 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fetchContent}
              onChange={(e) => setFetchContent(e.target.checked)}
              disabled={busy}
              className="rounded border-white/20"
            />
            <span>Fetch <span className="font-mono text-blue-400/80">SKILL.md</span> content</span>
            <span className="text-white/25">(slower, uses GitHub rate limit)</span>
          </label>
          <label className="text-xs text-white/45 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              disabled={busy}
              className="rounded border-white/20"
            />
            <span>Dry run</span>
            <span className="text-white/25">(parse only, no DB writes)</span>
          </label>
        </div>

        {/* Global error */}
        {globalError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <strong>Error:</strong> {globalError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!busy ? (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white"
              onClick={startImport}
            >
              <Download className="h-4 w-4 mr-2" />
              {dryRun ? "Start dry run" : "Start import"}
            </Button>
          ) : (
            <Button size="sm" variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={stopImport}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
        </div>

        {/* Live progress */}
        {batches.length > 0 && (
          <div className="space-y-3">
            {/* Overall bar */}
            {busy && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/40">
                  <span>{runningCat ? `Scraping: ${runningCat.label}…` : "Starting…"}</span>
                  <span>{doneCount} / {ALL_KEYWORDS.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(doneCount / ALL_KEYWORDS.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Totals */}
            {totals && (
              <div className="flex flex-wrap gap-4 text-sm items-center">
                <p>
                  Imported{" "}
                  <span className="text-blue-400 font-semibold">{totals.imported.toLocaleString()}</span>
                  {dryRun && <span className="text-white/40 ml-1 text-xs">(dry run)</span>}
                </p>
                <p className="text-white/50">Skipped {totals.skipped.toLocaleString()}</p>
                {totals.errors > 0 && <p className="text-red-400/70">{totals.errors} errors</p>}
                {totals.done && (
                  <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                  </span>
                )}
              </div>
            )}

            {/* Per-category grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {batches.map((b) => (
                <div
                  key={b.slug}
                  className={[
                    "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs border",
                    b.status === "running"  ? "border-blue-500/40 bg-blue-500/10 text-blue-300" :
                    b.status === "done"     ? "border-emerald-500/20 bg-emerald-500/5 text-white/60" :
                    b.status === "error"    ? "border-red-500/20 bg-red-500/5 text-red-400/80" :
                                             "border-white/[0.04] bg-transparent text-white/25",
                  ].join(" ")}
                >
                  <span className="truncate">
                    {b.status === "running" && <Loader2 className="inline h-2.5 w-2.5 animate-spin mr-1" />}
                    {b.label}
                  </span>
                  {b.status === "done" && (
                    <span className="text-emerald-400 ml-1 flex-shrink-0">+{b.imported}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Recently imported titles */}
            {totals && totals.titles.length > 0 && (
              <details className="text-xs">
                <summary className="text-white/30 cursor-pointer hover:text-white/50">
                  {totals.titles.length} recently imported
                </summary>
                <ul className="mt-2 space-y-0.5 max-h-40 overflow-y-auto">
                  {totals.titles.map((t, i) => (
                    <li key={i} className="text-white/55 truncate">{t}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Env hint */}
        <details className="text-xs text-white/25">
          <summary className="cursor-pointer hover:text-white/40 select-none">Setup requirements</summary>
          <div className="mt-2 rounded-md border border-white/[0.06] bg-black/20 p-3 space-y-1.5">
            <p>
              <span className="font-mono text-white/50">ADMIN_SECRET_KEY</span>
              <span className="text-white/30 ml-2">— any random string, protects the import API</span>
            </p>
            <p>
              <span className="font-mono text-white/50">GITHUB_TOKEN</span>
              <span className="text-white/30 ml-2">— GitHub PAT (public_repo scope). Raises rate limit from 60 → 5000 req/hr. Needed for large runs with SKILL.md fetching enabled.</span>
            </p>
            <p className="text-white/20 pt-1">Add both to <span className="font-mono">.env.local</span> and Vercel environment variables.</p>
          </div>
        </details>
      </div>
    </div>
  )
}
