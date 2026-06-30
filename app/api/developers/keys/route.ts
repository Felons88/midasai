import { createHash, randomBytes } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { checkBillingLimit, getBillingContext } from "@/lib/billing/entitlements"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).max(20).optional(),
})

function generateApiKeyMaterial() {
  const raw = `mk_${randomBytes(32).toString("hex")}`
  const keyHash = createHash("sha256").update(raw).digest("hex")
  const keyPrefix = raw.slice(0, 12)
  return { raw, keyHash, keyPrefix }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, permissions, status, rate_limit, last_used_at, created_at, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to load API keys" }, { status: 500 })
  }

  return NextResponse.json({ keys: data ?? [] })
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
  const limitCheck = checkBillingLimit(billing, "api_keys")

  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message, code: limitCheck.code },
      { status: 403 }
    )
  }

  const { raw, keyHash, keyPrefix } = generateApiKeyMaterial()
  const { name, description, permissions } = parsed.data

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name,
      description: description ?? null,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      key_value: keyHash,
      permissions: permissions ?? ["read:listings"],
      rate_limit: billing.limits.apiRateLimit,
      status: "ACTIVE",
    })
    .select("id, name, key_prefix, created_at")
    .single()

  if (error) {
    console.error("API key create error:", error)
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }

  return NextResponse.json(
    {
      key: data,
      secret: raw,
      message: "Store this secret securely. It will not be shown again.",
    },
    { status: 201 }
  )
}
