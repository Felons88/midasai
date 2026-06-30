import type { Metadata } from "next"
import Link from "next/link"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"
import { DocsProse } from "@/components/docs/DocsEndpoint"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "SDKs & tools",
  description: "Use curl, fetch, or any HTTP client with the MidasAI REST API. OpenAPI spec coming soon.",
}

export default function SdksPage() {
  const apiUrl = getApiUrl()

  return (
    <DocsShell
      title="SDKs & tools"
      description="The MidasAI API is a standard REST JSON API — use any HTTP client."
    >
      <DocsProse>
        <p>
          Official language SDKs are on the roadmap. Today, integrate with <code>fetch</code>,{" "}
          <code>curl</code>, or your preferred HTTP library.
        </p>

        <h2>TypeScript / JavaScript</h2>
      </DocsProse>

      <DocsCodeBlock
        language="typescript"
        code={`const API_KEY = process.env.MIDASAI_API_KEY!
const BASE = "${apiUrl}"

export async function listListings(page = 1) {
  const res = await fetch(\`\${BASE}/v1/listings?page=\${page}\`, {
    headers: { Authorization: API_KEY },
    next: { revalidate: 30 },
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}`}
      />

      <DocsProse>
        <h2>Python</h2>
      </DocsProse>

      <DocsCodeBlock
        language="python"
        code={`import os, requests

BASE = "${apiUrl}"
HEADERS = {"Authorization": os.environ["MIDASAI_API_KEY"]}

r = requests.get(f"{BASE}/v1/listings", headers=HEADERS, timeout=30)
r.raise_for_status()
print(r.json())`}
      />

      <DocsProse>
        <h2>OpenAPI</h2>
        <p>
          An OpenAPI 3 spec will be published at <code>/openapi.json</code>. Until then, use the{" "}
          <Link href="/api-docs/reference">API reference</Link>.
        </p>
      </DocsProse>
    </DocsShell>
  )
}
