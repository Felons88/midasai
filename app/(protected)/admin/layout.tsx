import { createClient } from "@/lib/supabase/server"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { ADMIN_ROLES } from "@/lib/auth/roles"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/admin/AdminShell"
import { getAdminOverview } from "@/lib/admin/queries"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminPrefix = getAdminRoutePrefix()

  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`${adminPrefix}/dashboard`)}`)
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.role || !ADMIN_ROLES.has(profile.role)) {
    redirect("/dashboard")
  }

  const overview = await getAdminOverview()

  return (
    <AdminShell
      adminPrefix={adminPrefix}
      badges={{
        listings: overview.pendingListings,
        moderation: overview.openReports,
        payouts: overview.pendingPayouts,
      }}
    >
      {children}
    </AdminShell>
  )
}
