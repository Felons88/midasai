import type { Metadata } from "next"
import Link from "next/link"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"
import { DocsSection } from "@/components/docs/DocsSection"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authenticate MidasAI API requests with API keys, permissions, and security best practices.",
}

export default function AuthenticationPage() {
  const apiUrl = getApiUrl()

  return (
    <DocsShell
      title="Authentication"
      description="Every v1 request must include a valid API key in the Authorization header."
    >
      <DocsSection
        title="Create an API key"
        lead={
          <>
            Generate keys in the{" "}
            <Link href="/developer/keys" className="text-amber-400 hover:underline">
              developer dashboard
            </Link>
            . Keys use the <code className="text-amber-200">mk_</code> or{" "}
            <code className="text-amber-200">midas_live_</code> prefix.
          </>
        }
        code={{
          title: "Dashboard → copy key",
          language: "text",
          code: `mk_a1b2c3d4e5f6...
# or
midas_live_a1b2c3d4...`,
        }}
      />

      <DocsSection
        title="Send the Authorization header"
        lead="Bearer and raw key formats are both accepted. You can also use X-API-Key."
        code={{
          title: "curl",
          code: `curl "${apiUrl}/v1/users/me" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
        }}
      />

      <DocsCodeBlock
        title="JavaScript (fetch)"
        language="javascript"
        code={`const res = await fetch("${apiUrl}/v1/users/me", {
  headers: {
    Authorization: process.env.MIDASAI_API_KEY,
    // or: Authorization: \`Bearer \${process.env.MIDASAI_API_KEY}\`,
  },
})
const { data } = await res.json()`}
      />

      <DocsSection
        title="Permission scopes"
        lead="Assign the minimum permissions your integration needs when creating a key."
        code={{
          title: "Common permissions",
          language: "json",
          code: `{
  "read": ["GET /v1/listings", "GET /v1/users/me"],
  "write": ["POST /v1/listings", "PUT /v1/users/me"],
  "delete": ["DELETE /v1/listings/:id"],
  "scoped": ["read:listings", "write:webhooks"]
}`,
        }}
      />

      <DocsSection
        title="401 — invalid key"
        lead="Missing or invalid credentials return a JSON error with HTTP 401."
        code={{
          title: "Response",
          language: "json",
          code: `{
  "error": "Missing or invalid API key",
  "hint": "Use Authorization: Bearer YOUR_KEY or X-API-Key header"
}`,
        }}
      />

      <DocsSection
        title="Security checklist"
        code={{
          title: ".env (server-side only)",
          language: "bash",
          code: `# Never commit this file
MIDASAI_API_KEY=mk_your_secret_key_here

# Rotate immediately if exposed
# Revoke in dashboard → Developer → API Keys`,
        }}
      />
    </DocsShell>
  )
}
