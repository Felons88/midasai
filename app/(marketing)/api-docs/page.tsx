import type { Metadata } from "next"
import Link from "next/link"
import { Zap, Book, Shield, Globe, Code, ChevronRight } from "lucide-react"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"
import { DocsSection } from "@/components/docs/DocsSection"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Introduction",
  description: "Overview of the MidasAI REST API for marketplace listings, users, analytics, and webhooks.",
}

export default function ApiDocsPage() {
  const apiUrl = getApiUrl()

  return (
    <DocsShell
      title="MidasAI API"
      description="Build integrations with the MidasAI marketplace — listings, user profiles, analytics, and webhooks over a versioned REST API."
    >
      <DocsCodeBlock
        title="Quick test"
        language="powershell"
        code={`Invoke-RestMethod -Uri "${apiUrl}/v1/listings" -Headers @{
  "Authorization" = "YOUR_API_KEY"
}`}
      />

      <DocsCodeBlock
        title="Sample response"
        language="json"
        code={`{
  "data": [
    {
      "id": "uuid",
      "title": "Example Skill",
      "type": "SKILL",
      "price": 0,
      "average_rating": 4.8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "total_pages": 8
  }
}`}
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/api-docs/getting-started", icon: Zap, title: "Quickstart", desc: "First API call in minutes" },
          { href: "/api-docs/authentication", icon: Shield, title: "Authentication", desc: "API keys and permissions" },
          { href: "/api-docs/reference", icon: Book, title: "API reference", desc: "All v1 endpoints" },
          { href: "/api-docs/webhooks", icon: Globe, title: "Webhooks", desc: "Real-time event delivery" },
          { href: "/api-docs/sdks", icon: Code, title: "SDKs", desc: "curl, fetch, and OpenAPI" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-amber-500/30 hover:bg-white/[0.04]"
          >
            <card.icon className="mb-3 h-5 w-5 text-amber-400" />
            <h3 className="font-semibold group-hover:text-amber-300">{card.title}</h3>
            <p className="mt-1 text-sm text-white/55">{card.desc}</p>
            <span className="mt-3 flex items-center gap-1 text-sm text-amber-400">
              Read more <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid gap-6 border-t border-white/[0.06] pt-10 sm:grid-cols-4">
        {[
          { value: "13", label: "REST endpoints" },
          { value: "v1", label: "Stable API version" },
          { value: "100/min", label: "Default rate limit" },
          { value: "JSON", label: "Response format" },
        ].map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <div className="text-2xl font-bold text-amber-400">{stat.value}</div>
            <div className="text-sm text-white/50">{stat.label}</div>
          </div>
        ))}
      </div>

      <DocsSection
        title="Subdomains"
        lead="Dedicated hosts for API, docs, developer portal, and creator studio."
        code={{
          title: "Environment URLs",
          language: "bash",
          code: `API_BASE=https://api.midasai.tech
DOCS=https://docs.midasai.tech
DEVELOPER=https://developer.midasai.tech
CREATOR=https://creator.midasai.tech
MARKETPLACE=https://midasai.tech`,
        }}
      />
    </DocsShell>
  )
}
