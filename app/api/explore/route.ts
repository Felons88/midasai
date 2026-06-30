import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || ''
  const sort = searchParams.get('sort') || 'trending'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 24

  const supabase = await createPublicClient()

  let dbQuery = supabase
    .from('listings')
    .select('id, title, description, type, price, downloads, views, average_rating, review_count, tags, images, language, created_at, updated_at, creator_id, slug')
    .eq('status', 'ACTIVE')

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
  }

  if (type && type !== 'ALL') {
    dbQuery = dbQuery.eq('type', type)
  }

  switch (sort) {
    case 'trending':   dbQuery = dbQuery.order('views', { ascending: false }); break
    case 'newest':     dbQuery = dbQuery.order('created_at', { ascending: false }); break
    case 'downloads':  dbQuery = dbQuery.order('downloads', { ascending: false }); break
    case 'rating':     dbQuery = dbQuery.order('average_rating', { ascending: false }); break
    case 'updated':    dbQuery = dbQuery.order('updated_at', { ascending: false }); break
    default:           dbQuery = dbQuery.order('views', { ascending: false })
  }

  dbQuery = dbQuery.range((page - 1) * limit, page * limit - 1)

  const { data: listings, error } = await dbQuery
  if (error) return NextResponse.json({ listings: [], total: 0 }, { status: 200 })

  return NextResponse.json({ listings: listings || [], page, limit })
}
