import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/Navbar"
import { AuthenticatedNavbar } from "@/components/layout/AuthenticatedNavbar"
import { Footer } from "@/components/layout/Footer"

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

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const authenticatedNavbar = user ? (
    <AuthenticatedNavbar
      userRole={user.user_metadata?.role || 'USER'}
      userName={user.user_metadata?.name || user.email || ''}
      userAvatar={user.user_metadata?.avatar_url || ''}
    />
  ) : null

  return (
    <>
      {authenticatedNavbar || <Navbar />}
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  )
}
