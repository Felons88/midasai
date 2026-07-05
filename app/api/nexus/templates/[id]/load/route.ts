import { createClient, createServiceClient } from '@/lib/supabase/server'
import { convertN8nToNexus } from '@/lib/nexus/n8n-converter'
import { loadCustomNodes } from '@/lib/nexus/custom-nodes'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch template metadata
    const { data: template, error: templateError } = await supabase
      .from('nexus_workflow_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    let nexusDefinition = template.definition
    let credentialRequirements: string[] = []

    // If the template has a storage path, load the raw JSON from storage and convert it
    if (template.storage_path) {
      const serviceClient = createServiceClient()
      const { data: fileData, error: downloadError } = await serviceClient
        .storage
        .from('n8n-workflows')
        .download(template.storage_path)

      if (downloadError) {
        return NextResponse.json({
          error: 'Failed to load workflow file from storage',
          details: downloadError.message,
        }, { status: 500 })
      }

      const rawJson = await fileData.text()
      const n8nWorkflow = JSON.parse(rawJson)

      // Ensure any dynamically-added n8n nodes are available before conversion
      await loadCustomNodes()

      nexusDefinition = convertN8nToNexus(n8nWorkflow, { autoLayout: true })
      credentialRequirements = nexusDefinition.metadata?.credential_requirements || []
    } else if (template.definition) {
      // Fallback to the stored definition if no storage path exists
      credentialRequirements = template.definition.metadata?.credential_requirements || []
    }

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        seo_title: template.seo_title,
        description: template.description,
        category: template.category,
        icon: template.icon,
        color: template.color,
        tags: template.tags,
        difficulty: template.difficulty,
        source: template.source,
        source_url: template.source_url,
        storage_path: template.storage_path,
        storage_url: template.storage_url,
      },
      definition: nexusDefinition,
      credentialRequirements,
    })
  } catch (error) {
    console.error('Error loading template from storage:', error)
    return NextResponse.json({
      error: 'Failed to load template',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
