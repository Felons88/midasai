import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the MCP server
    const { data: existing } = await supabase
      .from('mcp_servers')
      .select('user_id, endpoint')
      .eq('id', params.id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Test connection to MCP server
    const response = await fetch(existing.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'initialize', params: {} }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to connect to MCP server' }, { status: 400 })
    }

    const result = await response.json()

    // Update server status
    await supabase
      .from('mcp_servers')
      .update({
        status: 'ACTIVE',
        last_health_check: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('[mcp/[id]/connect]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
