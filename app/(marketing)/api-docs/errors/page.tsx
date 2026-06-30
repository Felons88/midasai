import type { Metadata } from "next"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"
import { DocsSection } from "@/components/docs/DocsSection"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Errors",
  description: "HTTP status codes and error response format for the MidasAI API.",
}

const ERRORS = [
  { code: 400, title: "Bad Request", example: '{ "error": "Invalid input" }' },
  { code: 401, title: "Unauthorized", example: '{ "error": "Invalid API key" }' },
  { code: 403, title: "Forbidden", example: '{ "error": "API key missing \'write\' permission" }' },
  { code: 404, title: "Not Found", example: '{ "error": "Listing not found" }' },
  { code: 429, title: "Too Many Requests", example: '{ "error": "Rate limit exceeded" }' },
  { code: 500, title: "Server Error", example: '{ "error": "Internal server error" }' },
]

export default function ErrorsPage() {
  const apiUrl = getApiUrl()

  return (
    <DocsShell title="Errors" description="How the API signals failures and how to handle them.">
      <DocsSection
        title="Error response shape"
        lead="All errors return JSON with a single error string. Check the HTTP status code for the category."
        code={{
          title: "Example",
          language: "json",
          code: `{
  "error": "Human-readable message"
}`,
        }}
      />

      <DocsCodeBlock
        title="Handle errors in code"
        language="typescript"
        code={`const res = await fetch("${apiUrl}/v1/listings/invalid-id", {
  headers: { Authorization: process.env.MIDASAI_API_KEY! },
})

if (!res.ok) {
  const body = await res.json().catch(() => ({}))
  throw new Error(\`MidasAI \${res.status}: \${body.error ?? res.statusText}\`)
}`}
      />

      <DocsSection title="Status code reference" lead="Common responses you will encounter in production." />

      <div className="space-y-3">
        {ERRORS.map((err) => (
          <div
            key={err.code}
            className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden"
          >
            <div className="flex gap-4 p-4 border-b border-white/[0.06]">
              <span className="font-mono text-lg font-bold text-amber-400">{err.code}</span>
              <p className="font-medium text-white">{err.title}</p>
            </div>
            <pre className="px-4 py-3 text-xs text-white/70 font-mono overflow-x-auto">{err.example}</pre>
          </div>
        ))}
      </div>
    </DocsShell>
  )
}
