import type { Metadata } from "next"
import Link from "next/link"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"
import { DocsEndpoint, DocsProse } from "@/components/docs/DocsEndpoint"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Webhooks",
  description: "Register webhook endpoints to receive MidasAI marketplace events in real time.",
}

const EVENTS = [
  { event: "listing.created", description: "A new listing is submitted" },
  { event: "listing.updated", description: "A listing is updated" },
  { event: "listing.published", description: "A listing goes active" },
  { event: "purchase.completed", description: "A purchase completes" },
  { event: "review.created", description: "A new review is posted" },
]

export default function WebhooksPage() {
  const apiUrl = getApiUrl()

  return (
    <DocsShell
      title="Webhooks"
      description="Receive HTTP callbacks when marketplace events occur instead of polling the API."
    >
      <DocsProse>
        <p>
          Manage webhooks via the <Link href="/developer/webhooks">dashboard</Link> or the{" "}
          <Link href="https://docs.midasai.tech/api/reference#webhooks">v1 API</Link>.
        </p>
      </DocsProse>

      <DocsEndpoint
        method="POST"
        path="/v1/webhooks"
        description="Register a webhook endpoint"
        auth="write"
      >
        <DocsCodeBlock
          code={`curl -X POST "${apiUrl}/v1/webhooks" \\
  -H "Authorization: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production",
    "url": "https://example.com/webhooks/midasai",
    "events": ["listing.created", "purchase.completed"]
  }'`}
        />
      </DocsEndpoint>

      <DocsProse>
        <h2>Supported events</h2>
      </DocsProse>

      <div className="space-y-2">
        {EVENTS.map((e) => (
          <div
            key={e.event}
            className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3"
          >
            <code className="text-amber-300">{e.event}</code>
            <span className="text-sm text-white/55">{e.description}</span>
          </div>
        ))}
      </div>

      <DocsProse>
        <h2>Verifying signatures</h2>
        <p>
          Each webhook receives a <code>whsec_</code> secret on creation. Validate the{" "}
          <code>X-MidasAI-Signature</code> header on incoming payloads before processing.
        </p>
      </DocsProse>
    </DocsShell>
  )
}
