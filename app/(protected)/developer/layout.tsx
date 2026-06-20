import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DeveloperSidebar } from "@/components/layout/DeveloperSidebar"
import { getPlanLimits } from "@/lib/subscriptions"

async function getDeveloperData(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('name, email, avatar_url')
      .eq('id', userId)
      .single()
    
    // Get subscription tier
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .single()
    
    // Calculate storage usage from assets
    const { data: assets } = await supabase
      .from('assets')
      .select('file_size')
      .eq('user_id', userId)
    
    const storageUsed = assets?.reduce((sum, asset) => sum + (asset.file_size || 0), 0) || 0
    const storageUsedGB = storageUsed / (1024 * 1024 * 1024) // Convert bytes to GB
    
    // Get API usage count
    const { count: apiUsage } = await supabase
      .from('api_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    const tier = subscription?.tier || 'FREE'
    const planLimits = getPlanLimits(tier)
    return {
      name: user?.name || '',
      email: user?.email || '',
      avatar_url: user?.avatar_url || '',
      subscriptionTier: tier,
      storageUsed: storageUsedGB,
      storageTotal: planLimits.storageGb,
      apiUsage: apiUsage || 0,
    }
  } catch (error) {
    console.error('Error fetching developer data:', error)
    return {
      name: '',
      email: '',
      avatar_url: '',
      subscriptionTier: 'FREE',
      storageUsed: 0,
      storageTotal: getPlanLimits('FREE').storageGb,
      apiUsage: 0,
    }
  }
}

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const developerData = await getDeveloperData(user.id)

  return (
    <div className="flex h-screen bg-[#07070b]">
      <DeveloperSidebar
        userName={developerData.name}
        userEmail={developerData.email}
        userAvatar={developerData.avatar_url}
        subscriptionTier={developerData.subscriptionTier}
        storageUsed={developerData.storageUsed}
        storageTotal={developerData.storageTotal}
        apiUsage={developerData.apiUsage}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
