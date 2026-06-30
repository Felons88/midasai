import { getSiteSettings } from "@/lib/admin/queries"
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm"
import { AdminPageHeader } from "@/components/admin/AdminUi"

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div>
      <AdminPageHeader
        title="Platform settings"
        description="Site configuration, fees, and maintenance mode"
      />
      <AdminSettingsForm settings={settings} />
    </div>
  )
}
