import { createClient } from "@/lib/supabase/server"
import { getPlanLimits } from "@/lib/subscriptions"
import DashboardClient from "./DashboardClient"

async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const [
    { data: userData },
    { count: downloads },
    { count: bookmarks },
    { count: listings },
    { data: transactions },
    { data: sub },
    { data: recentActivity },
    { data: recentListings },
    { data: notifications },
  ] = await Promise.all([
    supabase.from('users').select('name, role').eq('id', userId).single(),
    supabase.from('downloads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('creator_id', userId),
    supabase.from('transactions').select('amount').eq('creator_id', userId).eq('status', 'COMPLETED'),
    supabase.from('subscriptions').select('tier, status').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('activity_feed').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(8),
    supabase.from('listings').select('id, title, price, downloads, created_at').order('created_at', { ascending: false }).limit(6),
    supabase.from('notifications').select('id, title, message, type, priority, read_at, created_at').eq('user_id', userId).is('read_at', null).order('created_at', { ascending: false }).limit(5),
  ])

  const revenue = transactions?.reduce((s: number, t: { amount: number }) => s + (t.amount || 0), 0) || 0
  const tier = ((sub as { tier?: string } | null)?.tier || 'FREE') as string
  const planLimits = getPlanLimits(tier)

  return {
    userName: (userData as { name?: string } | null)?.name || '',
    userRole: (userData as { role?: string } | null)?.role || 'USER',
    tier,
    planName: tier.charAt(0) + tier.slice(1).toLowerCase(),
    planLimits,
    stats: { downloads: downloads || 0, bookmarks: bookmarks || 0, listings: listings || 0, revenue },
    recentActivity: recentActivity || [],
    recentListings: recentListings || [],
    notifications: notifications || [],
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const data = await getDashboardData(user.id)
  return <DashboardClient data={data} />
}
