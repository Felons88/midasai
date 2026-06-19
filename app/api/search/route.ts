import { NextRequest, NextResponse } from 'next/server'
import { searchListings } from '@/lib/search'
import type { SearchFilters, ListingType, SortOption } from '@/lib/search/types'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const filters: SearchFilters = {}

  const query = searchParams.get('q')
  if (query) filters.query = query

  const type = searchParams.get('type')
  if (type) {
    const types = type.split(',') as ListingType[]
    filters.type = types.length === 1 ? types[0] : types
  }

  const category = searchParams.get('category')
  if (category) filters.category = category

  const tags = searchParams.get('tags')
  if (tags) filters.tags = tags.split(',')

  const creator = searchParams.get('creator')
  if (creator) filters.creator = creator

  const platform = searchParams.get('platform')
  if (platform) filters.platform = platform

  const minPrice = searchParams.get('minPrice')
  if (minPrice) filters.minPrice = parseFloat(minPrice)

  const maxPrice = searchParams.get('maxPrice')
  if (maxPrice) filters.maxPrice = parseFloat(maxPrice)

  const minRating = searchParams.get('minRating')
  if (minRating) filters.minRating = parseFloat(minRating)

  const sort = searchParams.get('sort') as SortOption | null
  if (sort) filters.sort = sort

  const page = searchParams.get('page')
  if (page) filters.page = parseInt(page, 10)

  const limit = searchParams.get('limit')
  if (limit) filters.limit = parseInt(limit, 10)

  try {
    const response = await searchListings(filters)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      { status: 500 }
    )
  }
}
