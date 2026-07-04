import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: invoices, error } = await supabase
      .from("billing_invoices")
      .select("*")
      .or(`user_id.eq.${user.id},organization_id.in.(select organization_id from organization_members where user_id = ${user.id})`)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ invoices: invoices || [] })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
