import { createClient } from "@/lib/supabase/server"
import ApplicationsClient from "./ApplicationsClient"

async function getPageData(userId: string) {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const applications = (rows || []).map(a => ({
    id: a.id,
    name: a.name,
    description: a.description || "",
    website: a.website || "",
    callbackUrl: a.callback_url || "",
    clientId: a.client_id || "",
    status: (a.status || "ACTIVE").toLowerCase(),
    createdAt: new Date(a.created_at).toLocaleDateString(),
  }))

  const active = applications.filter(a => a.status === "active").length

  return { applications, stats: { total: applications.length, active } }
}

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { applications, stats } = await getPageData(user.id)
  return <ApplicationsClient applications={applications} stats={stats} />
}
