import { createClient } from "@/lib/supabase/server"
import { ADMIN_ROLES } from "@/lib/auth/admin-roles"

export { ADMIN_ROLES, isAdminRole } from "@/lib/auth/admin-roles"

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function requireAdmin() {
  const { supabase, user } = await getAuthenticatedUser()
  if (!user) {
    return { error: "Unauthorized" as const, status: 401 as const }
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.role || !ADMIN_ROLES.has(profile.role)) {
    return { error: "Forbidden" as const, status: 403 as const }
  }

  return { supabase, user, role: profile.role }
}
