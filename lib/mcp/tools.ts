import type { SupabaseClient } from "@supabase/supabase-js"
import {
  getBillingContext,
  type BillingTier,
} from "@/lib/billing/entitlements"
import {
  hasMcpPermission,
  roleMeetsMinimum,
  type McpAuthContext,
} from "@/lib/mcp/auth"

export type McpToolDefinition = {
  name: string
  description: string
  minimumRole: "USER" | "CREATOR" | "ADMIN"
  requiredPermission: string
  inputSchema: Record<string, unknown>
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "midas_account_context",
    description: "Safe account summary: role, plan tier, and usage limits for the authenticated user.",
    minimumRole: "USER",
    requiredPermission: "account:read",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "midas_search_listings",
    description: "Search public ACTIVE marketplace listings (title, type, price only).",
    minimumRole: "USER",
    requiredPermission: "listings:search",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        type: { type: "string" },
        limit: { type: "number", maximum: 20 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "midas_my_listings",
    description: "List the caller's own listings (metadata only, no secrets).",
    minimumRole: "CREATOR",
    requiredPermission: "listings:own",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", maximum: 25 } },
      additionalProperties: false,
    },
  },
  {
    name: "midas_creator_stats",
    description: "Aggregated creator revenue and sales counts for the authenticated user.",
    minimumRole: "CREATOR",
    requiredPermission: "creator:read",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "midas_platform_stats",
    description: "High-level platform counts (admin only). No PII.",
    minimumRole: "ADMIN",
    requiredPermission: "platform:read",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
]

export function listToolsForContext(ctx: McpAuthContext): McpToolDefinition[] {
  return MCP_TOOLS.filter(
    (tool) =>
      roleMeetsMinimum(ctx.role, tool.minimumRole) &&
      hasMcpPermission(ctx, tool.requiredPermission)
  )
}

export async function executeMcpTool(
  service: SupabaseClient,
  ctx: McpAuthContext,
  name: string,
  args: Record<string, unknown>
): Promise<{ content: { type: string; text: string }[] }> {
  const tool = MCP_TOOLS.find((t) => t.name === name)
  if (!tool) throw new McpToolError("Unknown tool", 404)
  if (!roleMeetsMinimum(ctx.role, tool.minimumRole)) {
    throw new McpToolError("Insufficient role", 403)
  }
  if (!hasMcpPermission(ctx, tool.requiredPermission)) {
    throw new McpToolError("Permission denied", 403)
  }

  switch (name) {
    case "midas_account_context":
      return accountContext(service, ctx.userId)
    case "midas_search_listings":
      return searchListings(service, args)
    case "midas_my_listings":
      return myListings(service, ctx.userId, args)
    case "midas_creator_stats":
      return creatorStats(service, ctx.userId)
    case "midas_platform_stats":
      return platformStats(service)
    default:
      throw new McpToolError("Unknown tool", 404)
  }
}

export class McpToolError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function accountContext(service: SupabaseClient, userId: string) {
  const { data: user } = await service
    .from("users")
    .select("name, role, created_at")
    .eq("id", userId)
    .single()

  const billing = await getBillingContext(service, userId)

  const payload = {
    name: user?.name ?? null,
    role: user?.role ?? "USER",
    member_since: user?.created_at ?? null,
    plan: billing.limits.tier as BillingTier,
    limits: {
      listings: billing.limits.maxListings,
      api_keys: billing.limits.maxApiKeys,
      mcp_servers: billing.limits.maxMcpServers,
      downloads_per_month: billing.limits.maxDownloadsPerMonth,
    },
    usage: billing.usage,
  }

  return jsonResult(payload)
}

async function searchListings(service: SupabaseClient, args: Record<string, unknown>) {
  const query = typeof args.query === "string" ? args.query.trim() : ""
  const type = typeof args.type === "string" ? args.type : undefined
  const limit = Math.min(Number(args.limit) || 10, 20)

  let dbQuery = service
    .from("listings")
    .select("id, title, type, price, downloads, average_rating, status")
    .eq("status", "ACTIVE")
    .order("downloads", { ascending: false })
    .limit(limit)

  if (type) dbQuery = dbQuery.eq("type", type)
  if (query) dbQuery = dbQuery.ilike("title", `%${query}%`)

  const { data, error } = await dbQuery
  if (error) throw new McpToolError("Search failed", 500)

  return jsonResult({ listings: data ?? [] })
}

async function myListings(
  service: SupabaseClient,
  userId: string,
  args: Record<string, unknown>
) {
  const limit = Math.min(Number(args.limit) || 10, 25)

  const { data, error } = await service
    .from("listings")
    .select("id, title, type, price, status, downloads, created_at")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new McpToolError("Failed to load listings", 500)

  return jsonResult({ listings: data ?? [] })
}

async function creatorStats(service: SupabaseClient, userId: string) {
  const { data: transactions } = await service
    .from("transactions")
    .select("amount, status, net_amount")
    .eq("creator_id", userId)

  const completed = (transactions ?? []).filter((t) => t.status === "COMPLETED")
  const gross = completed.reduce((s, t) => s + Number(t.amount), 0)
  const net = completed.reduce((s, t) => s + Number(t.net_amount), 0)

  const { count: activeListings } = await service
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", userId)
    .eq("status", "ACTIVE")

  return jsonResult({
    sales_count: completed.length,
    gross_revenue: gross,
    net_revenue: net,
    active_listings: activeListings ?? 0,
  })
}

async function platformStats(service: SupabaseClient) {
  const [{ count: users }, { count: listings }, { count: pending }] = await Promise.all([
    service.from("users").select("id", { count: "exact", head: true }),
    service.from("listings").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    service.from("listings").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
  ])

  return jsonResult({
    total_users: users ?? 0,
    active_listings: listings ?? 0,
    pending_listings: pending ?? 0,
  })
}

function jsonResult(payload: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  }
}
