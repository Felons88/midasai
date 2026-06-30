"use client"

import { useCallback, useState } from "react"
import { Download, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ParsedClawHubSkill } from "@/lib/ingestion/clawhub"
import { SYSTEM_CREATOR_NAME } from "@/lib/ingestion/clawhub"

const BATCH_SIZE = 25
const BATCH_DELAY_MS = 3000
const MAX_BATCH_RETRIES = 5

type ScrapeResult = {
  imported: number
  skipped: number
  errors: string[]
  hasMore: boolean
  nextCursor: string | null
  samples: ParsedClawHubSkill[]
}

type ScrapeState = ScrapeResult & { batches: number; paused?: boolean }

function isTransientError(message: string): boolean {
  return /\b(429|502|503|504|rate limit|temporarily unavailable)\b/i.test(message)
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

export function ClawHubScraperTool() {
  const [busy, setBusy] = useState(false)
  const [scrapingAll, setScrapingAll] = useState(false)
  const [result, setResult] = useState<ScrapeState | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"PENDING" | "ACTIVE">("PENDING")
  const [fetchDetail, setFetchDetail] = useState(false)

  const runBatch = useCallback(
    async (append: boolean, nextCursor?: string) => {
      const res = await fetch("/api/admin/ingest/clawhub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: BATCH_SIZE,
          cursor: append ? nextCursor : undefined,
          status,
          fetchDetail,
        }),
      })
      const data = (await res.json()) as ScrapeResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Scrape failed")
      return data
    },
    [status, fetchDetail]
  )

  const runBatchWithRetry = useCallback(
    async (append: boolean, nextCursor?: string) => {
      let lastError: Error | null = null
      for (let attempt = 0; attempt < MAX_BATCH_RETRIES; attempt++) {
        try {
          return await runBatch(append, nextCursor)
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Scrape failed")
          if (!isTransientError(lastError.message) || attempt === MAX_BATCH_RETRIES - 1) {
            throw lastError
          }
          await sleep(Math.min(30_000, 3000 * 2 ** attempt))
        }
      }
      throw lastError ?? new Error("Scrape failed")
    },
    [runBatch]
  )

  function mergeResult(prev: ScrapeState | null, data: ScrapeResult, append: boolean): ScrapeState {
    if (append && prev) {
      return {
        imported: prev.imported + data.imported,
        skipped: prev.skipped + data.skipped,
        errors: [...prev.errors, ...(data.errors ?? [])],
        hasMore: data.hasMore,
        nextCursor: data.nextCursor,
        samples: data.samples?.length ? data.samples : prev.samples,
        batches: prev.batches + 1,
        paused: false,
      }
    }
    return {
      imported: data.imported,
      skipped: data.skipped,
      errors: data.errors ?? [],
      hasMore: data.hasMore,
      nextCursor: data.nextCursor,
      samples: data.samples ?? [],
      batches: 1,
      paused: false,
    }
  }

  async function scrapeBatch(append = false) {
    setBusy(true)
    setError(null)
    try {
      const data = await runBatchWithRetry(append, append ? cursor : undefined)
      setResult((prev) => mergeResult(append ? prev : null, data, append))
      setCursor(data.nextCursor ?? undefined)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scrape failed"
      setError(message)
      setResult((prev) => (prev ? { ...prev, paused: true } : prev))
    } finally {
      setBusy(false)
    }
  }

  async function scrapeAll(resume = false) {
    setScrapingAll(true)
    setBusy(true)
    setError(null)
    if (!resume) {
      setResult(null)
      setCursor(undefined)
    }

    let totalImported = resume && result ? result.imported : 0
    let totalSkipped = resume && result ? result.skipped : 0
    const allErrors = resume && result ? [...result.errors] : []
    let samples = resume && result ? result.samples : []
    let nextCursor = resume ? cursor : undefined
    let batches = resume && result ? result.batches : 0
    let hasMore = true

    try {
      while (hasMore) {
        const data = await runBatchWithRetry(batches > 0 || Boolean(nextCursor), nextCursor)
        totalImported += data.imported
        totalSkipped += data.skipped
        allErrors.push(...(data.errors ?? []))
        if (data.samples?.length) samples = data.samples
        nextCursor = data.nextCursor ?? undefined
        hasMore = Boolean(data.hasMore && data.nextCursor)
        batches++

        setResult({
          imported: totalImported,
          skipped: totalSkipped,
          errors: allErrors,
          hasMore,
          nextCursor: data.nextCursor,
          samples,
          batches,
          paused: false,
        })
        setCursor(nextCursor)

        if (hasMore) {
          await sleep(BATCH_DELAY_MS)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scrape failed"
      setError(
        `${message} — progress saved. Use "Resume scrape" to continue from the last cursor.`
      )
      setResult({
        imported: totalImported,
        skipped: totalSkipped,
        errors: allErrors,
        hasMore: Boolean(nextCursor),
        nextCursor: nextCursor ?? null,
        samples,
        batches,
        paused: true,
      })
      setCursor(nextCursor)
    } finally {
      setBusy(false)
      setScrapingAll(false)
    }
  }

  const canResume = Boolean(result?.paused && result?.hasMore && cursor)

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="border-b border-white/[0.06] px-5 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">ClawHub Scraper</h3>
          <p className="text-xs text-white/45">
            Scrapes{" "}
            <a
              href="https://clawhub.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline"
            >
              clawhub.ai
            </a>{" "}
            OpenClaw skills → Supabase listings as {SYSTEM_CREATOR_NAME}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-white/55 leading-relaxed">
          Parses each skill&apos;s <strong className="text-white/80">name</strong>,{" "}
          <strong className="text-white/80">description</strong>, and{" "}
          <strong className="text-white/80">install steps</strong> (`clawhub install …`), then
          creates marketplace listings with install commands under{" "}
          <span className="font-mono text-amber-400/90">{SYSTEM_CREATOR_NAME}</span>.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <label className="text-xs text-white/50 flex items-center gap-2">
            Import status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "PENDING" | "ACTIVE")}
              disabled={busy}
              className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-white text-xs"
            >
              <option value="PENDING">PENDING (moderation)</option>
              <option value="ACTIVE">ACTIVE (live)</option>
            </select>
          </label>
          <label className="text-xs text-white/50 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fetchDetail}
              onChange={(e) => setFetchDetail(e.target.checked)}
              disabled={busy}
              className="rounded border-white/20"
            />
            Fetch full detail per skill (slower, more 503 risk)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => scrapeBatch(false)} disabled={busy}>
            {busy && !scrapingAll ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Scrape batch ({BATCH_SIZE})
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => scrapeAll(false)}
            disabled={busy}
          >
            {scrapingAll ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Scrape all skills
          </Button>
          {canResume && (
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => scrapeAll(true)}
              disabled={busy}
            >
              Resume scrape
            </Button>
          )}
          {result?.hasMore && result.nextCursor && !scrapingAll && !canResume && (
            <Button
              size="sm"
              variant="outline"
              className="border-white/10"
              onClick={() => scrapeBatch(true)}
              disabled={busy}
            >
              Continue from cursor
            </Button>
          )}
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
                <span className="text-amber-400 font-semibold">{result.imported}</span>
              </p>
              <p className="text-white/60">Skipped {result.skipped} duplicates</p>
              <p className="text-white/40">{result.batches} batch(es)</p>
              {result.paused && result.hasMore && (
                <span className="text-amber-400/90 text-xs font-medium">Paused — resume to continue</span>
              )}
              {!result.hasMore && !result.paused && (
                <span className="text-emerald-400/90 text-xs font-medium">Catalog complete</span>
              )}
            </div>

            {result.errors.length > 0 && (
              <details className="text-xs text-red-300/80">
                <summary>{result.errors.length} errors</summary>
                <ul className="mt-2 list-disc pl-4 max-h-32 overflow-y-auto">
                  {result.errors.slice(0, 20).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </details>
            )}

            {result.samples.length > 0 && (
              <div>
                <p className="text-xs font-medium text-white/50 mb-2">Recently parsed</p>
                <ul className="space-y-2">
                  {result.samples.map((sample) => (
                    <li
                      key={sample.slug}
                      className="rounded-md border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs"
                    >
                      <p className="font-medium text-white">{sample.name}</p>
                      <p className="text-white/45 mt-0.5 line-clamp-2">{sample.description}</p>
                      <p className="font-mono text-amber-400/80 mt-1">
                        {sample.installSteps[0]?.command}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
