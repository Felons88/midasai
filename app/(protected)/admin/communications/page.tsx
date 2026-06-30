import { AdminCommunicationsPanel } from "@/components/admin/AdminCommunicationsPanel"
import { AdminPageHeader } from "@/components/admin/AdminUi"

export default function AdminCommunicationsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Communications"
        description="Broadcast notifications and publish changelog popups to users"
      />
      <AdminCommunicationsPanel />
    </div>
  )
}
