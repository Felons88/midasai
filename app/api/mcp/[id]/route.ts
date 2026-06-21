import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody, mcpServerSchema } from '@/lib/validation/schemas'
import { getPlanLimits } from '@/lib/subscriptions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: mcpServer, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !mcpServer) {
      return NextResponse.json({ error: 'MCP server not found' }, { status: 404 })
    }

    return NextResponse.json(mcpServer)
  } catch (error) {
    console.error('[mcp/[id]] GET', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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

    const body = await request.json()
    const validatedData = await validateBody(mcpServerSchema.partial(), body)

    // Check if user's plan allows MCP servers
    const { data: entitlements } = await supabase
      .from('feature_entitlements')
      .select('max_mcp_servers, tier')
      .eq('user_id', user.id)
      .single()
    
    const planLimits = getPlanLimits(entitlements?.tier)
    if (planLimits.maxMcpServers === 0) {
      return NextResponse.json({ 
        error: 'Your plan does not include MCP servers. Upgrade to enable this feature.' 
      }, { status: 403 })
    }

    const { data: mcpServer, error } = await supabase
      .from('mcp_servers')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(mcpServer)
  } catch (error) {
    console.error('[mcp/[id]] PATCH', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.startsWith('[')) {
      const validationErrors = JSON.parse(error.message)
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('mcp_servers')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mcp/[id]] DELETE', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
