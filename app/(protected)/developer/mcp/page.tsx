import { createClient } from "@/lib/supabase/server"
import { getPlanLimits } from "@/lib/subscriptions"
import McpClient from "./McpClient"

async function getPageData(userId: string) {
  const supabase = await createClient()

  const [{ data: rows }, { data: sub }] = await Promise.all([
    supabase
      .from("mcp_servers")
      .select("id, name, status, created_at, last_used_at, mcp_tokens(token)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .maybeSingle(),
  ])

  const tier = sub?.tier ?? "FREE"
  const limits = getPlanLimits(tier)

  const connections = (rows || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    token: s.mcp_tokens?.[0]?.token ?? "",
    status: (s.status || "ACTIVE").toLowerCase(),
    createdAt: new Date(s.created_at).toLocaleDateString(),
    lastUsed: s.last_used_at ? new Date(s.last_used_at).toLocaleDateString() : null,
  }))

  return { connections, plan: { tier, maxMcpServers: limits.maxMcpServers } }
}

export default async function McpServersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { connections, plan } = await getPageData(user.id)
  const projectUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://midasai.app"
  return <McpClient connections={connections} projectUrl={projectUrl} plan={plan} />
}
