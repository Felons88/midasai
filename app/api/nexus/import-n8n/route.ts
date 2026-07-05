import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { convertN8nToNexus, validateN8nWorkflow, type N8nWorkflow } from '@/lib/nexus/n8n-converter'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { n8nWorkflow, name, description } = body

    if (!n8nWorkflow) {
      return NextResponse.json({ error: 'n8nWorkflow is required' }, { status: 400 })
    }

    // Validate the n8n workflow
    const validation = validateN8nWorkflow(n8nWorkflow)
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Invalid n8n workflow', 
        details: validation.errors 
      }, { status: 400 })
    }

    // Convert to Nexus format
    const nexusDefinition = convertN8nToNexus(n8nWorkflow)

    // Create the workflow in Nexus
    const { data: workflow, error } = await supabase
      .from('nexus_workflows')
      .insert({
        user_id: user.id,
        name: name || n8nWorkflow.name || 'Imported n8n Workflow',
        description: description || n8nWorkflow.description || `Imported from n8n: ${n8nWorkflow.name}`,
        definition: nexusDefinition,
        status: 'draft',
        execution_count: 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      workflow,
      warnings: validation.warnings 
    }, { status: 201 })

  } catch (error) {
    console.error('Error importing n8n workflow:', error)
    return NextResponse.json({ 
      error: 'Failed to import n8n workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
