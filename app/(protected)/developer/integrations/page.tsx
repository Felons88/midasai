import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { IntegrationsClient } from "./IntegrationsClient"
import { getSiteUrl } from "@/lib/site-url"

export const metadata = {
  title: "Integrations — MidasAI Developer",
  description: "Manage all IDE bridge connections, MCP agents, and Nexus connections.",
}

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const siteUrl = getSiteUrl()

  const [
    { data: bridgeDevices },
    { data: mcpServers },
    { data: nexusConnections },
  ] = await Promise.all([
    supabase
      .from("bridge_devices")
      .select("id, ide_name, ide_version, device_name, device_os, device_arch, bridge_port, last_seen, created_at")
      .eq("user_id", user.id)
      .order("last_seen", { ascending: false }),
    supabase
      .from("mcp_servers")
      .select("id, name, description, endpoint, version, status, total_requests, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("nexus_connections")
      .select("id, name, type, status, last_sync, connection_config, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ])

  return (
    <IntegrationsClient
      bridgeDevices={bridgeDevices ?? []}
      mcpServers={mcpServers ?? []}
      nexusConnections={nexusConnections ?? []}
      siteUrl={siteUrl}
    />
  )
}
