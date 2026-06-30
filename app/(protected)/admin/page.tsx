import { redirect } from "next/navigation"
import { getAdminRoutePrefix } from "@/lib/admin-route"

export default function AdminIndexPage() {
  redirect(`${getAdminRoutePrefix()}/dashboard`)
}
