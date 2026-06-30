import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/server"
import { checkBillingLimit, getBillingContext } from "@/lib/billing/entitlements"
import {
  defaultPermissionsForRole,
  generateMcpTokenMaterial,
} from "@/lib/mcp/auth"
import { getSiteUrl } from "@/lib/site-url"

export type CreateMcpConnectionInput = {
  name: string
  description?: string
  version?: string
}

export type CreateMcpConnectionSuccess = {
  ok: true
  server: {
    id: string
    name: string
    endpoint: string
    version: string
    status: string
    created_at: string
  }
  token: string
  permissions: string[]
}

export type CreateMcpConnectionFailure = {
  ok: false
  status: number
  error: string
  code?: string
}

export type CreateMcpConnectionResult =
  | CreateMcpConnectionSuccess
  | CreateMcpConnectionFailure

export function isDashboardCreatePayload(body: unknown): boolean {
  if (!body || typeof body !== "object") return false
  const record = body as Record<string, unknown>
  return (
    typeof record.name === "string" &&
    record.name.trim().length > 0 &&
    record.jsonrpc === undefined &&
    record.method === undefined
  )
}

function serviceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
}

export async function createMcpConnection(
  supabase: SupabaseClient,
  userId: string,
  input: CreateMcpConnectionInput
): Promise<CreateMcpConnectionResult> {
  const name = input.name.trim()
  if (!name || name.length > 120) {
    return { ok: false, status: 400, error: "Invalid connection name" }
  }

  if (!serviceRoleConfigured()) {
    return {
      ok: false,
      status: 500,
      error: "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is required to mint MCP tokens.",
    }
  }

  const billing = await getBillingContext(supabase, userId)
  const limitCheck = checkBillingLimit(billing, "mcp_servers")
  if (!limitCheck.allowed) {
    return {
      ok: false,
      status: 403,
      error: limitCheck.message,
      code: limitCheck.code,
    }
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  const appUrl = getSiteUrl()
  const endpoint = `${appUrl}/api/mcp`

  const { data: server, error } = await supabase
    .from("mcp_servers")
    .insert({
      user_id: userId,
      name,
      description: input.description?.trim() || null,
      endpoint,
      version: input.version ?? "1.0.0",
      status: "ACTIVE",
    })
    .select("id, name, endpoint, version, status, created_at")
    .single()

  if (error || !server) {
    console.error("MCP server create error:", error)
    return {
      ok: false,
      status: 500,
      error: error?.message || "Failed to create MCP connection in Supabase",
    }
  }

  const { raw, tokenHash } = generateMcpTokenMaterial()
  const permissions = defaultPermissionsForRole(profile?.role ?? "USER")
  const service = createServiceClient()

  const { error: tokenError } = await service.from("mcp_tokens").insert({
    user_id: userId,
    mcp_server_id: server.id,
    token_hash: tokenHash,
    permissions,
    expires_at: null,
  })

  if (tokenError) {
    console.error("MCP token create error:", tokenError)
    await supabase.from("mcp_servers").delete().eq("id", server.id)
    return { ok: false, status: 500, error: "Failed to store MCP token" }
  }

  return {
    ok: true,
    server,
    token: raw,
    permissions,
  }
}
