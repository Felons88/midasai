import type { Metadata } from "next"
import Link from "next/link"
import { DocsShell } from "@/components/docs/DocsShell"
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"
import { DocsSection } from "@/components/docs/DocsSection"
import { getApiUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "MCP integration",
  description: "Connect AI agents to MidasAI MCP servers via the Model Context Protocol.",
}

export default function MCPPage() {
  const apiUrl = getApiUrl()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://midasai.tech"

  return (
    <DocsShell
      title="MCP integration"
      description="Use Model Context Protocol servers listed on MidasAI in your AI workflows."
    >
      <DocsSection
        title="MCP endpoint"
        lead="Agents call the MidasAI MCP JSON-RPC endpoint with an mcp_ token or API key."
        code={{
          title: "GET server info",
          code: `curl "${siteUrl}/api/mcp" \\
  -H "X-MCP-Token: mcp_YOUR_TOKEN"`,
        }}
      />

      <DocsCodeBlock
        title="Claude Desktop config"
        language="json"
        code={`{
  "mcpServers": {
    "midasai": {
      "url": "${siteUrl}/api/mcp",
      "headers": {
        "X-MCP-Token": "mcp_YOUR_TOKEN"
      }
    }
  }
}`}
      />

      <DocsSection
        title="Create a token"
        lead={
          <>
            Generate MCP tokens in the{" "}
            <Link href="/developer/mcp" className="text-amber-400 hover:underline">
              developer MCP console
            </Link>
            .
          </>
        }
        code={{
          title: "tools/list (JSON-RPC)",
          language: "json",
          code: `curl -X POST "${siteUrl}/api/mcp" \\
  -H "Content-Type: application/json" \\
  -H "X-MCP-Token: mcp_YOUR_TOKEN" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'`,
        }}
      />

      <DocsSection
        title="Discover MCP listings via REST"
        code={{
          title: "curl",
          code: `curl "${apiUrl}/v1/listings?type=MCP&limit=10" \\
  -H "Authorization: YOUR_API_KEY"`,
        }}
      />

      <DocsCodeBlock
        title="Sample response"
        language="json"
        code={`{
  "data": [
    {
      "id": "…",
      "title": "GitHub MCP Server",
      "type": "MCP",
      "description": "Interact with GitHub via MCP"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 42 }
}`}
      />
    </DocsShell>
  )
}
