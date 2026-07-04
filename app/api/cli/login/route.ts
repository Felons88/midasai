/**
 * POST /api/cli/login
 * Creates a CLI login request token.
 * Returns: { token, authUrl } so the CLI can open the browser.
 */
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { getSiteUrl } from "@/lib/site-url"

export async function POST(request: Request) {
  try {
    const token = randomBytes(32).toString("hex")
    const siteUrl = getSiteUrl()
    const authUrl = `${siteUrl}/cli/auth/${token}`

    // In a real implementation, store this in a database with expiry
    // For now, we'll use a simple in-memory approach or Supabase
    // Store: token, created_at, expires_at, status, user_id (when approved)

    // For MVP, we'll use Supabase to store the login request
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { error } = await supabase
      .from("cli_login_requests")
      .insert({
        token,
        status: "pending",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })

    if (error) {
      console.error("cli/login POST", error)
      // For MVP, continue even if table doesn't exist yet
    }

    return NextResponse.json({ token, authUrl })
  } catch (e) {
    console.error("cli/login POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
