import { createClient } from "@/lib/supabase/server"
import McpClient from "./McpClient"

async function getPageData(userId: string) {
  const supabase = await createClient()

  // Fetch mcp_servers (used as connection records) joined with their tokens
  const { data: rows } = await supabase
    .from("mcp_servers")
    .select("id, name, status, created_at, last_used_at, mcp_tokens(token)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const connections = (rows || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    token: s.mcp_tokens?.[0]?.token ?? "",
    status: (s.status || "ACTIVE").toLowerCase(),
    createdAt: new Date(s.created_at).toLocaleDateString(),
    lastUsed: s.last_used_at ? new Date(s.last_used_at).toLocaleDateString() : null,
  }))

  return { connections }
}

export default async function McpServersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { connections } = await getPageData(user.id)
  const projectUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://midasai.app"
  return <McpClient connections={connections} projectUrl={projectUrl} />
}
