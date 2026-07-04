import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    const { data: invitations, error } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", params.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ invitations: invitations || [] })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

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

    // Check if user already exists and is a member
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", params.id)
        .eq("user_id", existingUser.id)
        .maybeSingle()

      if (existingMember) {
        return NextResponse.json({ error: "User is already a member of this organization" }, { status: 409 })
      }
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from("organization_invitations")
      .insert({
        organization_id: params.id,
        email,
        role,
        status: "pending",
        invited_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // TODO: Send invitation email via Resend

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}
