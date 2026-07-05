import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const source = searchParams.get('source')

  let query = supabase
    .from('nexus_workflow_templates')
    .select('*')
    .eq('is_active', true)

  if (category) {
    query = query.eq('category', category)
  }

  if (source) {
    query = query.eq('source', source)
  }

  const { data: templates, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ templates })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'OWNER')) {
    return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { 
      name, 
      seo_title,
      description, 
      category, 
      icon, 
      color, 
      tags, 
      difficulty, 
      definition, 
      source = 'manual',
      source_url,
      source_metadata,
      storage_path,
      storage_url
    } = body

    if (!name || !category || !definition) {
      return NextResponse.json({ 
        error: 'name, category, and definition are required' 
      }, { status: 400 })
    }

    const { data: template, error } = await supabase
      .from('nexus_workflow_templates')
      .insert({
        name,
        seo_title,
        description,
        category,
        icon: icon || '✨',
        color: color || '#8b5cf6',
        tags: tags || [],
        difficulty: difficulty || 'beginner',
        definition,
        source,
        source_url,
        source_metadata: source_metadata || {},
        storage_path,
        storage_url
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to create template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
