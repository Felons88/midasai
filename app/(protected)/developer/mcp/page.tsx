import { createClient } from "@/lib/supabase/server"
import { getPlanLimits } from "@/lib/subscriptions"
import { getSiteUrl } from "@/lib/site-url"
import McpClient from "./McpClient"

async function getPageData(userId: string) {
  const supabase = await createClient()

  const [{ data: rows, error: rowsError }, { data: sub }] = await Promise.all([
    supabase
      .from("mcp_servers")
      .select("id, name, status, created_at, last_health_check")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .maybeSingle(),
  ])

  if (rowsError) {
    console.error("MCP servers load error:", rowsError)
  }

  const tier = sub?.tier ?? "FREE"
  const limits = getPlanLimits(tier)

  const connections = (rows ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    status: (s.status || "ACTIVE").toLowerCase(),
    createdAt: new Date(s.created_at ?? Date.now()).toLocaleDateString(),
    lastUsed: s.last_health_check
      ? new Date(s.last_health_check).toLocaleDateString()
      : null,
  }))

  return { connections, plan: { tier, maxMcpServers: limits.maxMcpServers } }
}

export default async function McpServersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { connections, plan } = await getPageData(user.id)
  const projectUrl = getSiteUrl()
  return <McpClient connections={connections} projectUrl={projectUrl} plan={plan} />
}
