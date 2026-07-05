"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, Loader2, RefreshCw, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"

type Category = {
  name: string
  path: string
}

type ScrapeResult = {
  success: boolean
  imported: number
  failed: number
  errors: Array<{ file: string; error: string }>
  warnings: string[]
  total?: number
}

export function N8nScraperTool() {
  const [busy, setBusy] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"category" | "full">("category")

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/nexus/scrape-n8n")
      if (!res.ok) throw new Error("Failed to fetch categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories")
    }
  }

  const scrapeCategory = async () => {
    if (!selectedCategory) {
      setError("Please select a category")
      return
    }

    setBusy(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/admin/nexus/scrape-n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "category",
          category: selectedCategory,
        }),
      })

      const data = (await res.json()) as ScrapeResult & { error?: string }
      
      if (!res.ok) {
        throw new Error(data.error || "Scrape failed")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scrape failed")
    } finally {
      setBusy(false)
    }
  }

  const scrapeFull = async () => {
    setBusy(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/admin/nexus/scrape-n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "full",
        }),
      })

      const data = (await res.json()) as ScrapeResult & { error?: string }
      
      if (!res.ok) {
        throw new Error(data.error || "Scrape failed")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scrape failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="border-b border-white/[0.06] px-5 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Workflow className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">AI n8n Workflow Importer</h3>
          <p className="text-xs text-white/45">
            Imports n8n workflows from{" "}
            <a
              href="https://github.com/zie619/n8n-workflows"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              zie619/n8n-workflows
            </a>{" "}
            and auto-generates readable titles and descriptions
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-white/55 leading-relaxed">
          Fetches n8n workflow JSON files from GitHub, converts them to Nexus format, auto-generates a readable title and a one-sentence description for each workflow, and saves them as templates in the database. Existing templates are updated with better titles and descriptions when re-run.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <label className="text-xs text-white/50 flex items-center gap-2">
            Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "category" | "full")}
              disabled={busy}
              className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-white text-xs"
            >
              <option value="category">Category (recommended)</option>
              <option value="full">Full scrape (all categories)</option>
            </select>
          </label>

          {mode === "category" && (
            <label className="text-xs text-white/50 flex items-center gap-2">
              Category
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={busy}
                className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-white text-xs min-w-[200px]"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {mode === "category" ? (
            <Button size="sm" onClick={scrapeCategory} disabled={busy || !selectedCategory}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Import category
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              onClick={scrapeFull}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Scrape all workflows
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={fetchCategories}
            disabled={busy}
          >
            Refresh categories
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-white/[0.06] bg-black/20 p-4 space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <p>
                Imported{" "}
                <span className="text-blue-400 font-semibold">{result.imported}</span>
              </p>
              <p className="text-white/60">Failed {result.failed}</p>
              {result.total && (
                <p className="text-white/40">Total {result.total}</p>
              )}
              {result.success ? (
                <span className="text-emerald-400/90 text-xs font-medium">Success</span>
              ) : (
                <span className="text-red-400/90 text-xs font-medium">Completed with errors</span>
              )}
            </div>

            {result.warnings.length > 0 && (
              <details className="text-xs text-amber-300/80">
                <summary>{result.warnings.length} warnings</summary>
                <ul className="mt-2 list-disc pl-4 max-h-32 overflow-y-auto">
                  {result.warnings.slice(0, 20).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
            )}

            {result.errors.length > 0 && (
              <details className="text-xs text-red-300/80">
                <summary>{result.errors.length} errors</summary>
                <ul className="mt-2 list-disc pl-4 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <li key={i}>
                      <span className="font-mono">{e.file}</span>: {e.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
