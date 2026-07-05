import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { credentialService } from "@/lib/credentials/service"
import type { CredentialData } from "@/lib/credentials/provider-types"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const credentials = await credentialService.list(user.id)
  return NextResponse.json({ credentials })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { provider, name, description, fields, isDefault, autoSave } = body

  if (!provider || !fields) {
    return NextResponse.json({ error: "provider and fields are required" }, { status: 400 })
  }

  // Auto-generate name if not provided (for auto-save from workspace)
  const credentialName = name || `${provider} Credential`

  const data: CredentialData = {
    provider,
    name: credentialName,
    description: description || (autoSave ? "Auto-saved from workspace" : undefined),
    fields,
    isDefault: isDefault || false
  }

  const result = await credentialService.create(user.id, data)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ credential: result.credential }, { status: 201 })
}
