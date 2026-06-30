import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    // Sanitize every field — never let empty string reach an array column
    const insert = {
      creator_id: user.id,
      title: String(body.title || '').trim(),
      description: String(body.description || '').trim(),
      type: ['SKILL', 'WORKFLOW', 'TEMPLATE', 'PLUGIN'].includes(body.type) ? body.type : 'SKILL',
      status: 'PENDING',
      price: typeof body.price === 'number' ? body.price : 0,
      tags: Array.isArray(body.tags) ? body.tags.filter((t: any) => typeof t === 'string') : [],
      images: [],
      topics: Array.isArray(body.topics) ? body.topics.filter((t: any) => typeof t === 'string') : [],
      github_url: body.github_url || null,
      readme: body.readme || null,
      language: body.language || null,
      license: body.license || null,
    }

    console.log('Inserting listing:', JSON.stringify({ ...insert, readme: insert.readme?.substring(0, 50) }))

    const { data, error } = await supabase.from('listings').insert(insert).select('id').single()

    if (error) {
      console.error('Listing insert error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 400 })
    }

    return NextResponse.json({ id: data.id })
  } catch (err: any) {
    console.error('Listing create error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
