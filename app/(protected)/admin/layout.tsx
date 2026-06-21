import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { canAccessAdmin } from "@/lib/roles"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/admin/dashboard')
  }

  // Check if user has admin role
  const hasAccess = await canAccessAdmin(user.id)
  if (!hasAccess) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {children}
    </div>
  )
}
