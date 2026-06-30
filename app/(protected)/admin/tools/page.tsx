import { AdminPageHeader } from "@/components/admin/AdminUi"
import { ClawHubScraperTool } from "@/components/admin/ClawHubScraperTool"
import { SkillsmpScraperTool } from "@/components/admin/SkillsmpScraperTool"
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
        <span>2 tools available</span>
      </div>

      <SkillsmpScraperTool />

      <ClawHubScraperTool />
    </div>
  )
}
