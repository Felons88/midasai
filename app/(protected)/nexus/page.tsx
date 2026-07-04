import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NexusClient } from "@/components/nexus/NexusClient"
import { createNexusService } from "@/lib/nexus/service"

export const metadata = {
  title: "Nexus Studio — MidasAI",
  description: "AI-powered workflow automation and directory optimization",
}

export default async function NexusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?redirect=/nexus")

  const svc = createNexusService(supabase, user.id)

  const [workflows, nodes, directories, executions] = await Promise.allSettled([
    svc.listWorkflows(),
    svc.listNodes(),
    svc.listDirectories(),
    svc.listExecutions(),
  ])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Nexus Studio</h1>
        <p className="text-sm text-white/40">AI-powered workflow automation and directory optimization</p>
      </div>

      <NexusClient
        initialWorkflows={workflows.status === "fulfilled" ? workflows.value : []}
        initialNodes={nodes.status === "fulfilled" ? nodes.value : []}
        initialDirectories={directories.status === "fulfilled" ? directories.value : []}
        initialExecutions={executions.status === "fulfilled" ? executions.value : []}
      />
    </div>
  )
}
