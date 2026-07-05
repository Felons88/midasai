/**
 * POST /api/cli/auth/[token]
 * Handles approve/deny actions for CLI login requests.
 * On approve: updates the login request with user_id and email, generates an auth token.
 * Returns: { status, token?, userId?, email? }
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.json()
  const { action } = body

  if (action !== "approve" && action !== "deny") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Get the login request
  const { data: loginRequest, error: fetchError } = await supabase
    .from("cli_login_requests")
    .select("*")
    .eq("token", token)
    .single()

  if (fetchError || !loginRequest) {
    return NextResponse.json({ error: "Invalid login request" }, { status: 404 })
  }

  // Check if expired
  if (new Date(loginRequest.expires_at) < new Date()) {
    await supabase
      .from("cli_login_requests")
      .update({ status: "expired" })
      .eq("token", token)
    return NextResponse.json({ error: "Login request expired" }, { status: 400 })
  }

  // Handle deny
  if (action === "deny") {
    await supabase
      .from("cli_login_requests")
      .update({ status: "denied" })
      .eq("token", token)
    return NextResponse.json({ status: "denied" })
  }

  // Handle approve
  const authToken = randomBytes(32).toString("hex")

  const { error: updateError } = await supabase
    .from("cli_login_requests")
    .update({
      status: "approved",
      user_id: user.id,
      email: user.email,
      auth_token: authToken,
    })
    .eq("token", token)

  if (updateError) {
    console.error("cli/auth POST update error", updateError)
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 })
  }

  return NextResponse.json({
    status: "approved",
    token: authToken,
    userId: user.id,
    email: user.email,
  })
}
