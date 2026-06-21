import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { canAccessCreator } from "@/lib/roles"

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/creator/dashboard')
  }

  // Check if user has creator role
  const hasAccess = await canAccessCreator(user.id)
  if (!hasAccess) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {children}
    </div>
  )
}
