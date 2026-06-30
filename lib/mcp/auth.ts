import { createHash, randomBytes } from "crypto"
import { createServiceClient } from "@/lib/supabase/server"
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit"
import {
  authenticateApiKey,
  extractRawApiKey,
  isApiKeyFormat,
  type ApiKeyContext,
} from "@/lib/api/api-key-auth"

export type McpAuthContext = {
  userId: string
  role: string
  mcpServerId: string
  tokenId: string
  permissions: string[]
  via: "mcp_token" | "api_key"
  apiKeyId?: string
}

const ADMIN_ROLES = new Set(["ADMIN", "OWNER", "MODERATOR"])

export function roleMeetsMinimum(userRole: string | null, minimum: string): boolean {
  const role = userRole ?? "USER"
  if (minimum === "USER") return true
  if (minimum === "CREATOR") return role === "CREATOR" || ADMIN_ROLES.has(role)
  if (minimum === "ADMIN") return ADMIN_ROLES.has(role)
  return false
}

export async function authenticateMcpRequest(
  request: Request
): Promise<
  | { ok: true; ctx: McpAuthContext; rateLimitHeaders: Record<string, string> }
  | { ok: false; response: Response }
> {
  const raw =
    request.headers.get("x-mcp-token")?.trim() ?? extractRawApiKey(request)

  if (!raw) {
    return {
      ok: false,
      response: Response.json({ error: "Missing MCP token or API key" }, { status: 401 }),
    }
  }

  if (isApiKeyFormat(raw)) {
    const apiAuth = await authenticateApiKey(request)
    if (!apiAuth.ok) return { ok: false, response: apiAuth.response }

    const service = createServiceClient()
    const { data: profile } = await service
      .from("users")
      .select("role")
      .eq("id", apiAuth.ctx.userId)
      .maybeSingle()

    return {
      ok: true,
      ctx: {
        userId: apiAuth.ctx.userId,
        role: profile?.role ?? "USER",
        mcpServerId: "api-key",
        tokenId: apiAuth.ctx.keyId,
        permissions: apiAuth.ctx.permissions.length
          ? apiAuth.ctx.permissions
          : ["account:read", "listings:read"],
        via: "api_key",
        apiKeyId: apiAuth.ctx.keyId,
      },
      rateLimitHeaders: rateLimitHeaders(apiAuth.rateLimit),
    }
  }

  if (!raw.startsWith("mcp_")) {
    return {
      ok: false,
      response: Response.json({ error: "Invalid token format" }, { status: 401 }),
    }
  }

  const tokenHash = createHash("sha256").update(raw).digest("hex")
  const service = createServiceClient()

  const { data: tokenRow, error } = await service
    .from("mcp_tokens")
    .select(
      `
      id,
      user_id,
      mcp_server_id,
      permissions,
      expires_at,
      mcp_servers!inner(id, status, user_id)
    `
    )
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (error || !tokenRow) {
    return {
      ok: false,
      response: Response.json({ error: "Invalid MCP token" }, { status: 401 }),
    }
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return {
      ok: false,
      response: Response.json({ error: "MCP token expired" }, { status: 401 }),
    }
  }

  const server = tokenRow.mcp_servers as { id: string; status: string | null; user_id: string }
  if (server.status !== "ACTIVE" || server.user_id !== tokenRow.user_id) {
    return {
      ok: false,
      response: Response.json({ error: "MCP server inactive" }, { status: 403 }),
    }
  }

  const rateLimit = checkRateLimit(`mcp:${tokenRow.id}`, 300)
  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: Response.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      ),
    }
  }

  const { data: profile } = await service
    .from("users")
    .select("role")
    .eq("id", tokenRow.user_id)
    .maybeSingle()

  await service
    .from("mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenRow.id)

  return {
    ok: true,
    ctx: {
      userId: tokenRow.user_id,
      role: profile?.role ?? "USER",
      mcpServerId: tokenRow.mcp_server_id,
      tokenId: tokenRow.id,
      permissions: tokenRow.permissions ?? ["account:read"],
      via: "mcp_token",
    },
    rateLimitHeaders: rateLimitHeaders(rateLimit),
  }
}

export function generateMcpTokenMaterial() {
  const raw = `mcp_${randomBytes(32).toString("hex")}`
  const tokenHash = createHash("sha256").update(raw).digest("hex")
  return { raw, tokenHash }
}

export function defaultPermissionsForRole(role: string | null): string[] {
  const perms = ["account:read", "listings:search"]
  if (roleMeetsMinimum(role, "CREATOR")) {
    perms.push("creator:read", "listings:own")
  }
  if (roleMeetsMinimum(role, "ADMIN")) {
    perms.push("platform:read")
  }
  return perms
}

export function hasMcpPermission(ctx: McpAuthContext, permission: string): boolean {
  return ctx.permissions.includes(permission) || ctx.permissions.includes("*")
}
