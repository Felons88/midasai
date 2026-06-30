import { authenticateMcpRequest } from "@/lib/mcp/auth"
import { isDashboardCreatePayload } from "@/lib/mcp/create-connection"
import {
  executeMcpTool,
  listToolsForContext,
  McpToolError,
} from "@/lib/mcp/tools"
import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const SERVER_INFO = {
  name: "midasai",
  version: "1.0.0",
  protocol: "mcp-jsonrpc",
  description: "Role-scoped MidasAI context for LLM agents",
}

export async function GET(request: Request) {
  const auth = await authenticateMcpRequest(request)
  if (!auth.ok) return auth.response

  const tools = listToolsForContext(auth.ctx).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }))

  return NextResponse.json(
    {
      server: SERVER_INFO,
      role: auth.ctx.role,
      permissions: auth.ctx.permissions,
      tools,
      endpoint: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/mcp`,
    },
    { headers: auth.rateLimitHeaders }
  )
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  let body: Record<string, unknown>

  try {
    body = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null },
      { status: 400 }
    )
  }

  if (isDashboardCreatePayload(body)) {
    return NextResponse.json(
      {
        error: "This endpoint is for MCP clients only, not connection setup.",
        hint: "Create connections in Developer → MCP. Agents call this URL with X-MCP-Token after setup.",
        createEndpoint: "/api/developers/mcp",
      },
      { status: 400 }
    )
  }

  const started = Date.now()
  const auth = await authenticateMcpRequest(request)
  if (!auth.ok) return auth.response

  const protocolBody = body as {
    jsonrpc?: string
    id?: string | number
    method?: string
    params?: { name?: string; arguments?: Record<string, unknown> }
  }

  const id = protocolBody.id ?? null
  const service = createServiceClient()

  try {
    if (protocolBody.method === "initialize") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: SERVER_INFO,
            capabilities: { tools: {} },
          },
        },
        { headers: auth.rateLimitHeaders }
      )
    }

    if (protocolBody.method === "tools/list") {
      const tools = listToolsForContext(auth.ctx).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }))
      return NextResponse.json(
        { jsonrpc: "2.0", id, result: { tools } },
        { headers: auth.rateLimitHeaders }
      )
    }

    if (protocolBody.method === "tools/call") {
      const name = protocolBody.params?.name
      if (!name || typeof name !== "string") {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Tool name required" },
          },
          { status: 400, headers: auth.rateLimitHeaders }
        )
      }

      const result = await executeMcpTool(
        service,
        auth.ctx,
        name,
        protocolBody.params?.arguments ?? {}
      )

      if (auth.ctx.mcpServerId !== "api-key") {
        const { data: current } = await service
          .from("mcp_servers")
          .select("total_requests")
          .eq("id", auth.ctx.mcpServerId)
          .maybeSingle()
        await service
          .from("mcp_servers")
          .update({
            total_requests: (current?.total_requests ?? 0) + 1,
            last_health_check: new Date().toISOString(),
          })
          .eq("id", auth.ctx.mcpServerId)
      }

      return NextResponse.json(
        { jsonrpc: "2.0", id, result },
        { headers: auth.rateLimitHeaders }
      )
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: "Method not found" },
      },
      { status: 404, headers: auth.rateLimitHeaders }
    )
  } catch (err) {
    const status = err instanceof McpToolError ? err.status : 500
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32000, message } },
      { status, headers: auth.rateLimitHeaders }
    )
  } finally {
    const latency = Date.now() - started
    if (auth.ctx.via === "api_key" && auth.ctx.apiKeyId) {
      await service.from("api_usage").insert({
        user_id: auth.ctx.userId,
        api_key_id: auth.ctx.apiKeyId,
        endpoint: "/api/mcp",
        method: "POST",
        status_code: 200,
        latency_ms: latency,
      })
    }
  }
}
