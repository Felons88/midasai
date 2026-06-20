import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"

async function getUserRole(userId: string) {
  try {
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) return 'USER'
    return user?.role || 'USER'
  } catch {
    return 'USER'
  }
}

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const userRole = await getUserRole(user.id)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userRole={userRole} />
      <main className="flex-1 ml-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
