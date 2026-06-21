import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const creator = searchParams.get('creator')
    const tags = searchParams.get('tags')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sort') || 'relevance'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = await createClient()

    // Build base query
    let dbQuery = supabase
      .from('listings')
      .select(`
        *,
        creator:creators(id, name, avatar_url, verified),
        reviews(rating)
      `)
      .eq('status', 'ACTIVE')

    // Apply filters
    if (category) {
      dbQuery = dbQuery.eq('category', category)
    }

    if (type) {
      dbQuery = dbQuery.eq('type', type)
    }

    if (creator) {
      dbQuery = dbQuery.eq('creator_id', creator)
    }

    if (minPrice) {
      dbQuery = dbQuery.gte('price', parseFloat(minPrice))
    }

    if (maxPrice) {
      dbQuery = dbQuery.lte('price', parseFloat(maxPrice))
    }

    // Full-text search using PostgreSQL tsvector
    if (query) {
      // Use tsvector for full-text search with ranking
      const searchQuery = query.trim()
      if (searchQuery) {
        dbQuery = dbQuery.textSearch('search_vector', searchQuery, {
          type: 'websearch',
          config: 'english'
        })
      }
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        dbQuery = dbQuery.order('price', { ascending: true })
        break
      case 'price_desc':
        dbQuery = dbQuery.order('price', { ascending: false })
        break
      case 'newest':
        dbQuery = dbQuery.order('created_at', { ascending: false })
        break
      case 'popular':
        dbQuery = dbQuery.order('downloads', { ascending: false })
        break
      case 'rating':
        dbQuery = dbQuery.order('average_rating', { ascending: false })
        break
      default:
        // Relevance sorting - would use vector similarity in production
        dbQuery = dbQuery.order('created_at', { ascending: false })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    dbQuery = dbQuery.range(offset, offset + limit - 1)

    const { data: listings, error } = await dbQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { success: false, error: 'Search failed' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')
    
    if (query) {
      const searchQuery = query.trim()
      if (searchQuery) {
        countQuery.textSearch('search_vector', searchQuery, {
          type: 'websearch',
          config: 'english'
        })
      }
    }
    
    const { count } = await countQuery

    // Calculate average ratings
    const listingsWithRatings = listings?.map((listing: any) => {
      const ratings = listing.reviews?.map((r: any) => r.rating) || []
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
        : 0
      return {
        ...listing,
        average_rating: avgRating,
        review_count: ratings.length
      }
    }) || []

    return NextResponse.json({
      success: true,
      listings: listingsWithRatings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      filters: {
        query,
        category,
        type,
        creator,
        tags,
        minPrice,
        maxPrice,
        sort
      }
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}
