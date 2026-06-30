import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/Navbar"
import { AuthenticatedNavbar } from "@/components/layout/AuthenticatedNavbar"
import { Footer } from "@/components/layout/Footer"
import { shouldShowAdsForUser } from "@/lib/ads/server"
import { getSubdomain, isDocsExperience } from "@/lib/subdomains"
import { AdSenseScript } from "@/components/ads/AdSenseScript"

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
  const headersList = await headers()
  const host = headersList.get("host")
  const pathname = headersList.get("x-pathname") ?? ""
  const subdomain = getSubdomain(host)

  if (isDocsExperience(subdomain, pathname)) {
    return <>{children}</>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const showAds = user
    ? await shouldShowAdsForUser(supabase, user.id)
    : true

  const authenticatedNavbar = user ? (
    <AuthenticatedNavbar
      userRole={user.user_metadata?.role || 'USER'}
      userName={user.user_metadata?.name || user.email || ''}
      userAvatar={user.user_metadata?.avatar_url || ''}
    />
  ) : null

  return (
    <>
      <AdSenseScript />
      {authenticatedNavbar || <Navbar />}
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  )
}
