import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRecommendationsForUser } from "@/lib/recommendations/scoring"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const recommendations = await getRecommendationsForUser(user?.id ?? null, limit)

  return NextResponse.json({ recommendations })
}
