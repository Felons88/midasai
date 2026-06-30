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
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update server status to inactive
    await supabase
      .from('mcp_servers')
      .update({
        status: 'INACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mcp/[id]/disconnect]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
