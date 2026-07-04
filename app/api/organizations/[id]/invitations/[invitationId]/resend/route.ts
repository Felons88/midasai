import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string; invitationId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user is a member of the organization
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get invitation details
    const { data: invitation } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("id", params.invitationId)
      .eq("organization_id", params.id)
      .single()

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Update invitation timestamp
    await supabase
      .from("organization_invitations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", params.invitationId)

    // TODO: Resend invitation email via Resend

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resending invitation:", error)
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 })
  }
}
