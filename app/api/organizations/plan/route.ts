import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    // Get user's organization (assuming they just created one)
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    // Update organization with plan
    const { data: org, error } = await supabase
      .from("organizations")
      .update({ plan_id: planId })
      .eq("id", member.organization_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ organization: org })
  } catch (error) {
    console.error("Error setting organization plan:", error)
    return NextResponse.json({ error: "Failed to set plan" }, { status: 500 })
  }
}
