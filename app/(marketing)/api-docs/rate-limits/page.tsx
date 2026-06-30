import type { Metadata } from "next"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsSection } from "@/components/docs/DocsSection"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Rate limits",
  description: "MidasAI API rate limits, response headers, and best practices for high-volume clients.",
}

export default function RateLimitsPage() {
  const apiUrl = getApiUrl()

  return (
    <DocsShell
      title="Rate limits"
      description="Protect platform stability with per-key request quotas."
    >
      <DocsSection
        title="Default quota"
        lead="Each API key has a configurable rate_limit (default 100 requests per minute). Upgrade tiers in the developer dashboard."
        code={{
          title: "Inspect headers on any response",
          code: `curl -i "${apiUrl}/v1/listings?limit=1" \\
  -H "Authorization: YOUR_API_KEY"

# Response includes:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1719345678`,
        }}
      />

      <DocsSection
        title="Handle 429 responses"
        lead="When you exceed the limit, back off until the reset timestamp in X-RateLimit-Reset."
        code={{
          title: "Exponential backoff (TypeScript)",
          language: "typescript",
          code: `async function fetchWithRetry(url: string, init: RequestInit, attempt = 0) {
  const res = await fetch(url, init)
  if (res.status !== 429 || attempt >= 5) return res

  const reset = Number(res.headers.get("X-RateLimit-Reset") ?? 0)
  const waitMs = reset
    ? Math.max(0, reset * 1000 - Date.now())
    : Math.min(30_000, 500 * 2 ** attempt)

  await new Promise((r) => setTimeout(r, waitMs))
  return fetchWithRetry(url, init, attempt + 1)
}`,
        }}
      />

      <DocsSection
        title="v1 performance notes"
        code={{
          title: "Cached listing reads",
          code: `# GET /v1/listings responses are cached ~30s
# Auth is cached ~60s per key for lower latency
# Safe to poll listings every 30s+ without hammering the API`,
        }}
      />
    </DocsShell>
  )
}
