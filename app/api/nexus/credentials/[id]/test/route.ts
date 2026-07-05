import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { credentialService } from "@/lib/credentials/service"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const result = await credentialService.test(user.id, id)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ result: result.result })
}
