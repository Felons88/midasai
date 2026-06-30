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
      .select('user_id, endpoint, health_check_url')
      .eq('id', params.id)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Perform health check
    const healthCheckUrl = existing.health_check_url || existing.endpoint
    const startTime = Date.now()
    
    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    const responseTime = Date.now() - startTime

    // Update health check results
    await supabase
      .from('mcp_servers')
      .update({
        last_health_check: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response_time: responseTime,
    })
  } catch (error) {
    console.error('[mcp/[id]/test]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
