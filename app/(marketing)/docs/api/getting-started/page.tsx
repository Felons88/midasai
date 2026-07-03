import type { Metadata } from "next"
import Link from "next/link"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"
import { DocsSection } from "@/components/docs/DocsSection"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Quickstart",
  description: "Make your first MidasAI API request with an API key in under five minutes.",
}

export default function GettingStartedPage() {
  const apiUrl = getApiUrl()

  return (
    <DocsShell
      title="Quickstart"
      description="Create an API key, send a request, and parse the JSON response."
    >
      <DocsSection
        title="1. Create an API key"
        lead={
          <>
            Sign in to the{" "}
            <Link href="/developer/keys" className="text-amber-400 hover:underline">
              developer dashboard
            </Link>{" "}
            and create a key with at least <code className="text-amber-200">read</code> permission.
          </>
        }
        code={{
          title: "Store securely",
          language: "bash",
          code: `# .env.local (never commit)
MIDASAI_API_KEY=mk_your_key_here`,
        }}
      />

      <DocsSection
        title="2. Send your first request"
        lead={`All requests go to ${apiUrl}. Pass your key in the Authorization header.`}
        code={{
          title: "curl",
          code: `curl "${apiUrl}/v1/listings?limit=5" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        }}
      />

      <DocsCodeBlock
        title="JavaScript"
        language="javascript"
        code={`const res = await fetch("${apiUrl}/v1/listings?limit=5", {
  headers: { Authorization: process.env.MIDASAI_API_KEY! },
})
const { data, pagination } = await res.json()
console.log(data.length, pagination.total)`}
      />

      <DocsCodeBlock
        title="PowerShell"
        language="powershell"
        code={`$response = Invoke-RestMethod -Uri "${apiUrl}/v1/listings?limit=5" -Headers @{
  Authorization = $env:MIDASAI_API_KEY
}
$response.data | Select-Object -First 3 title, type`}
      />

      <DocsSection
        title="3. Parse the response"
        code={{
          title: "JSON shape",
          language: "json",
          code: `{
  "data": [
    { "id": "…", "title": "My Skill", "type": "SKILL", "price": 0 }
  ],
  "pagination": { "page": 1, "limit": 5, "total": 120, "total_pages": 24 }
}`,
        }}
      />
    </DocsShell>
  )
}
