import type { Metadata } from "next"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"
import { DocsEndpoint, DocsProse } from "@/components/docs/DocsEndpoint"
import { API_ENDPOINTS } from "@/lib/docs/navigation"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "API Reference",
  description: "Complete MidasAI v1 REST API reference for listings, users, analytics, and webhooks.",
}


export default function ReferencePage() {
  const apiUrl = getApiUrl()

  return (
    <DocsShell
      title="API Reference"
      description="Version 1 of the MidasAI REST API. All endpoints require a valid API key unless noted."
    >
      <DocsProse>
        <p>
          Base URL: <code>{apiUrl}</code>
        </p>
      </DocsProse>

      {API_ENDPOINTS.map((group) => (
        <div key={group.id} id={group.id} className="scroll-mt-24">
          <h2 className="mb-4 mt-10 text-xl font-semibold text-white">{group.category}</h2>
          {group.routes.map((route) => (
            <DocsEndpoint
              key={`${route.method}-${route.path}`}
              method={route.method}
              path={route.path}
              description={route.description}
              auth={route.auth}
            >
              <DocsCodeBlock
                title="Example"
                code={`curl -X ${route.method} "${apiUrl}${route.path.replace(":id", "LISTING_ID")}" \\
  -H "Authorization: YOUR_API_KEY"`}
              />
            </DocsEndpoint>
          ))}
        </div>
      ))}

      <DocsProse>
        <h2 id="response-format">Response format</h2>
        <p>Successful responses return JSON with a <code>data</code> field. List endpoints include <code>pagination</code>.</p>
        <DocsCodeBlock
          language="json"
          code={`{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}`}
        />
        <p>
          Errors return <code>{`{ "error": "message" }`}</code> with an appropriate HTTP status code. See{" "}
          <a href="/api-docs/errors">errors</a>.
        </p>
      </DocsProse>
    </DocsShell>
  )
}
