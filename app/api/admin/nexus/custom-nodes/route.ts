import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { loadCustomNodes, saveCustomNode } from '@/lib/nexus/custom-nodes'
import type { NodeDefinition } from '@/lib/nexus/node-registry'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'OWNER')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { supabase }
}

export async function GET() {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  try {
    const defs = await loadCustomNodes()
    return NextResponse.json({ nodes: defs })
  } catch (error) {
    console.error('Error loading custom nodes:', error)
    return NextResponse.json({
      error: 'Failed to load custom nodes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  try {
    const body = await request.json()
    const { n8nType, definition } = body as { n8nType: string; definition: NodeDefinition }

    if (!n8nType || !definition?.id || !definition?.name) {
      return NextResponse.json({ error: 'Missing n8nType or node definition' }, { status: 400 })
    }

    const saved = await saveCustomNode(definition, n8nType)
    return NextResponse.json({ success: true, node: saved })
  } catch (error) {
    console.error('Error saving custom node:', error)
    return NextResponse.json({
      error: 'Failed to save custom node',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
