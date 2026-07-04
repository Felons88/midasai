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
    // Generate a fresh auth token on each poll for approved state
    const { randomBytes } = await import("crypto")
    const authToken = randomBytes(32).toString("hex")
    return NextResponse.json({
      status: "approved",
      token: authToken,
      userId: loginRequest.user_id,
      email: loginRequest.email,
    })
  }

  return NextResponse.json({ status: loginRequest.status })
}
