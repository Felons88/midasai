/**
 * POST /api/admin/scrape/skillsmp
 *
 * Admin-only endpoint. Verifies the caller is an authenticated admin,
 * then invokes the scraper logic directly (no HTTP self-proxy).
 */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_ROLES } from "@/lib/auth/roles"
import { POST as runScrape } from "@/app/api/import/skillsmp/scrape/route"

export async function POST(request: NextRequest) {
  // Verify the caller is an authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.role || !ADMIN_ROLES.has(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  // Build a synthetic request with the admin key injected, then call the handler directly
  const syntheticReq = new NextRequest(request.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": process.env.ADMIN_SECRET_KEY ?? "",
    },
    body: JSON.stringify(body),
  })

  return runScrape(syntheticReq)
}
