import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { enforceLimit, LimitExceededError } from "@/lib/subscription-guard"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // ── Server-side limit enforcement ─────────────────────────────────────────
  let limitResult
  try {
    limitResult = await enforceLimit(user.id, "mcp_servers")
  } catch (e) {
    if (e instanceof LimitExceededError) {
      return NextResponse.json(
        {
          error: "limit_exceeded",
          message: e.message,
          currentCount: e.result.currentCount,
          limit: e.result.limit,
          tier: e.result.tier,
          upgradeRequired: e.result.upgradeRequired ?? null,
        },
        { status: 403 }
      )
    }
    throw e
  }

  const body = await request.json()
  const { name, projectUrl } = body as { name?: string; projectUrl?: string }

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const endpoint = projectUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://midasai.app"

  const { data: server, error: serverErr } = await supabase
    .from("mcp_servers")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: "MidasAI MCP connection for AI assistants",
      endpoint,
      version: "1.0.0",
      status: "ACTIVE",
      total_requests: 0,
      avg_latency_ms: 0,
    })
    .select("id")
    .single()

  if (serverErr) {
    console.error("[api/mcp] insert error:", serverErr)
    return NextResponse.json({ error: "Failed to create MCP connection" }, { status: 500 })
  }

  // Generate MCP token
  const token = `mcp_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`

  const { error: tokenErr } = await supabase.from("mcp_tokens").insert({
    user_id: user.id,
    mcp_server_id: server.id,
    token,
    status: "ACTIVE",
  })

  if (tokenErr) {
    console.error("[api/mcp] token insert error:", tokenErr)
    await supabase.from("mcp_servers").delete().eq("id", server.id)
    return NextResponse.json({ error: "Failed to create MCP token" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    connection: {
      id: server.id,
      name: name.trim(),
      token,   // Returned ONCE
      endpoint,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
    plan: {
      currentCount: limitResult.currentCount + 1,
      limit: limitResult.limit,
      tier: limitResult.tier,
    },
  })
}
