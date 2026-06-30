import { createClient } from "@/lib/supabase/server"
import { checkBillingLimit, getBillingContext } from "@/lib/billing/entitlements"
import { NextResponse } from "next/server"
import { z } from "zod"
import { randomBytes } from "crypto"

const createSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url().max(500),
  events: z.array(z.string()).min(1).max(20),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("webhooks")
    .select("id, name, url, events, status, last_delivery_at, total_deliveries, failed_deliveries, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to load webhooks" }, { status: 500 })
  }

  return NextResponse.json({ webhooks: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const billing = await getBillingContext(supabase, user.id)
  const limitCheck = checkBillingLimit(billing, "webhooks")

  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message, code: limitCheck.code },
      { status: 403 }
    )
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`

  const { data, error } = await supabase
    .from("webhooks")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
      status: "ACTIVE",
    })
    .select("id, name, url, events, status, created_at")
    .single()

  if (error) {
    console.error("Webhook create error:", error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }

  return NextResponse.json({ webhook: data, secret }, { status: 201 })
}
