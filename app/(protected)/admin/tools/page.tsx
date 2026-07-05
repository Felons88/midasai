import { AdminPageHeader } from "@/components/admin/AdminUi"
import { ClawHubScraperTool } from "@/components/admin/ClawHubScraperTool"
import { SkillsmpScraperTool } from "@/components/admin/SkillsmpScraperTool"
import { N8nScraperTool } from "@/components/admin/N8nScraperTool"
import { NodeDiscoveryTool } from "@/components/admin/NodeDiscoveryTool"
import { Wrench } from "lucide-react"

export default function AdminToolsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tools"
        description="Admin utilities for ingestion, scraping, and marketplace automation"
      />

      <div className="flex items-center gap-2 text-xs text-white/40">
        <Wrench className="h-3.5 w-3.5" />
        <span>4 tools available</span>
      </div>

      <SkillsmpScraperTool />

      <ClawHubScraperTool />

      <N8nScraperTool />

      <NodeDiscoveryTool />
    </div>
  )
}
