import { createClient, createServiceClient } from "@/lib/supabase/server"
import {
  defaultPermissionsForRole,
  generateMcpTokenMaterial,
} from "@/lib/mcp/auth"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: serverId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: server } = await supabase
    .from("mcp_servers")
    .select("id")
    .eq("id", serverId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!server) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const { raw, tokenHash } = generateMcpTokenMaterial()
  const permissions = defaultPermissionsForRole(profile?.role ?? "USER")
  const service = createServiceClient()

  const { error } = await service.from("mcp_tokens").insert({
    user_id: user.id,
    mcp_server_id: serverId,
    token_hash: tokenHash,
    permissions,
  })

  if (error) {
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
  }

  return NextResponse.json({
    token: raw,
    permissions,
    message: "Store this token securely. It will not be shown again.",
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: serverId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("mcp_servers")
    .update({ status: "INACTIVE" })
    .eq("id", serverId)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
