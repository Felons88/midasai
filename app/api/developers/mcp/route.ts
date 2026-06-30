import { createClient } from "@/lib/supabase/server"
import { createMcpConnection } from "@/lib/mcp/create-connection"
import { getSiteUrl } from "@/lib/site-url"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  version: z.string().max(20).optional(),
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
    .from("mcp_servers")
    .select("id, name, description, endpoint, version, status, total_requests, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to load servers" }, { status: 500 })
  }

  const appUrl = getSiteUrl()

  return NextResponse.json({
    servers: data ?? [],
    platformEndpoint: `${appUrl}/api/mcp`,
  })
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

  const result = await createMcpConnection(supabase, user.id, parsed.data)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status }
    )
  }

  return NextResponse.json(
    {
      server: result.server,
      token: result.token,
      permissions: result.permissions,
      message: "Store this MCP token securely. It will not be shown again.",
    },
    { status: 201 }
  )
}
