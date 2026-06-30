"use server"

import { createClient } from "@/lib/supabase/server"
import { createMcpConnection } from "@/lib/mcp/create-connection"

export type CreateMcpActionResult =
  | {
      ok: true
      server: { id: string; name: string }
      token: string
    }
  | {
      ok: false
      error: string
      code?: string
      status: number
    }

export async function createMcpConnectionAction(
  name: string
): Promise<CreateMcpActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: "Sign in to create MCP connections" }
  }

  const result = await createMcpConnection(supabase, user.id, { name })

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      error: result.error,
      code: result.code,
    }
  }

  return {
    ok: true,
    server: { id: result.server.id, name: result.server.name },
    token: result.token,
  }
}
