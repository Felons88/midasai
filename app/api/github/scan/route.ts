import { createClient } from "@/lib/supabase/server"
import { requireGitHubConnection } from "@/lib/github/connection"
import { scanGitHubRepository } from "@/lib/github/scan"
import { NextResponse } from "next/server"
import { z } from "zod"

const bodySchema = z.object({
  repoFullName: z.string().min(3),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "repoFullName required" }, { status: 400 })
  }

  const connection = await requireGitHubConnection(user.id)
  if (!connection) {
    return NextResponse.json({ error: "GitHub connection not found" }, { status: 404 })
  }

  try {
    const result = await scanGitHubRepository(connection, parsed.data.repoFullName)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed"
    const status = message.includes("own") || message.includes("Fork") ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
