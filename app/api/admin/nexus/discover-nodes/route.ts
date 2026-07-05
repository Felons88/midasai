import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { findUnknownN8nNodeTypes, getUnknownN8nNodeSamples, type N8nWorkflow } from '@/lib/nexus/n8n-converter'
import { generateNodeDefinition } from '@/lib/ai/gemini'

async function requireAdmin(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'OWNER')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { supabase, user }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request)
  if (admin.error) return admin.error

  try {
    const body = await request.json()
    const n8nWorkflow = body.n8nWorkflow as N8nWorkflow
    const generate = body.generate === true

    if (!n8nWorkflow || !Array.isArray(n8nWorkflow.nodes)) {
      return NextResponse.json({ error: 'Invalid n8n workflow' }, { status: 400 })
    }

    const unknownTypes = findUnknownN8nNodeTypes(n8nWorkflow)
    const samples = getUnknownN8nNodeSamples(n8nWorkflow)

    const generated: Record<string, object> = {}
    if (generate) {
      for (const type of unknownTypes) {
        const result = await generateNodeDefinition(type, samples[type] || {})
        if (result.success && result.content) {
          generated[type] = result.content
        }
      }
    }

    return NextResponse.json({
      unknownTypes,
      totalUnknown: unknownTypes.length,
      samples,
      generated,
    })
  } catch (error) {
    console.error('Error discovering nodes:', error)
    return NextResponse.json({
      error: 'Failed to discover nodes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
