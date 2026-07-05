/**
 * GET /api/cli/auth/[token]/poll
 * Polls the status of a CLI login request.
 * Returns: { status, token?, userId?, email? }
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: loginRequest, error } = await supabase
    .from("cli_login_requests")
    .select("*")
    .eq("token", token)
    .single()

  if (error || !loginRequest) {
    return NextResponse.json({ status: "error" }, { status: 404 })
  }

  // Check if expired
  if (new Date(loginRequest.expires_at) < new Date()) {
    await supabase
      .from("cli_login_requests")
      .update({ status: "expired" })
      .eq("token", token)
    return NextResponse.json({ status: "expired" })
  }

  // Return current status
  if (loginRequest.status === "approved") {
    // Return the stored auth_token from database
    return NextResponse.json({
      status: "approved",
      token: loginRequest.auth_token,
      userId: loginRequest.user_id,
      email: loginRequest.email,
    })
  }

  return NextResponse.json({ status: loginRequest.status })
}
