import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthenticatedShell } from "@/components/layout/AuthenticatedShell"

async function getUserData(userId: string) {
  try {
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('role, name, email, avatar_url')
      .eq('id', userId)
      .single()
    
    if (error) return { role: 'USER', name: '', email: '', avatar_url: '' }
    return {
      role: user?.role || 'USER',
      name: user?.name || '',
      email: user?.email || '',
      avatar_url: user?.avatar_url || '',
    }
  } catch {
    return { role: 'USER', name: '', email: '', avatar_url: '' }
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

  const userData = await getUserData(user.id)

  return (
    <AuthenticatedShell
      userRole={userData.role}
      userEmail={userData.email || user.email || ''}
      userName={userData.name}
      userAvatar={userData.avatar_url}
      userId={user.id}
    >
      {children}
    </AuthenticatedShell>
  )
}
