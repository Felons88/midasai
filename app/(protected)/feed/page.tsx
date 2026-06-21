import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FeedClient from "./FeedClient"

async function getFeedData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [
    { data: feed },
    { data: watchlist },
    { data: savedSearches },
    { data: milestones },
  ] = await Promise.all([
    supabase
      .from("activity_feed")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("watchlist_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_milestones")
      .select("*")
      .eq("user_id", user.id)
      .order("achieved_at", { ascending: false }),
  ])

  return {
    userId: user.id,
    feed: feed || [],
    watchlist: watchlist || [],
    savedSearches: savedSearches || [],
    milestones: milestones || [],
  }
}

export default async function FeedPage() {
  const data = await getFeedData()
  return <FeedClient data={data} />
}
