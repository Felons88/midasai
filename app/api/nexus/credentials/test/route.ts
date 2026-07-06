import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { testCredential } from "@/lib/credentials/tester"
import type { ProviderType } from "@/lib/credentials/provider-types"
// Import providers to ensure they are registered
import "@/lib/credentials/providers"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { provider, fields } = body

  if (!provider || !fields) {
    return NextResponse.json({ error: "provider and fields are required" }, { status: 400 })
  }

  try {
    const result = await testCredential(provider as ProviderType, fields)
    return NextResponse.json({ result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Test failed" },
      { status: 500 }
    )
  }
}
