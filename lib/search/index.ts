import { createClient } from '@/lib/supabase/server'
import type { SearchFilters, SearchResponse, SearchResult } from './types'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export async function searchListings(filters: SearchFilters): Promise<SearchResponse> {
  const supabase = await createClient()

  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, filters.limit ?? DEFAULT_LIMIT))
  const offset = (page - 1) * limit

  let query = supabase
    .from('listings')
    .select(`
      id,
      title,
      slug,
      description,
      type,
      status,
      price,
      views,
      downloads,
      average_rating,
      review_count,
      trending_score,
      platform,
      images,
      created_at,
      updated_at,
      creator:users!listings_creator_id_fkey(id, name, avatar_url),
      category:categories!listings_category_id_fkey(id, name, slug),
      listing_tags(tag:tags(id, name, slug))
    `, { count: 'exact' })
    .eq('status', 'ACTIVE')

  // Full-text search
  if (filters.query && filters.query.trim()) {
    const searchTerms = filters.query.trim().split(/\s+/).join(' & ')
    query = query.textSearch('search_vector', searchTerms, {
      type: 'websearch',
      config: 'english',
    })
  }

  // Filter by type
  if (filters.type) {
    if (Array.isArray(filters.type)) {
      query = query.in('type', filters.type)
    } else {
      query = query.eq('type', filters.type)
    }
  }

  // Filter by category slug
  if (filters.category) {
    query = query.eq('category.slug', filters.category)
  }

  // Filter by platform
  if (filters.platform) {
    query = query.contains('platform', [filters.platform])
  }

  // Filter by creator
  if (filters.creator) {
    query = query.eq('creator.name', filters.creator)
  }

  // Price filters
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice)
  }

  // Minimum rating
  if (filters.minRating !== undefined) {
    query = query.gte('average_rating', filters.minRating)
  }

  // Sorting
  switch (filters.sort) {
    case 'trending':
      query = query.order('trending_score', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'popular':
      query = query.order('downloads', { ascending: false })
      break
    case 'rating':
      query = query.order('average_rating', { ascending: false })
      break
    case 'downloads':
      query = query.order('downloads', { ascending: false })
      break
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'relevance':
    default:
      if (filters.query) {
        // Supabase handles relevance ordering for text search
      } else {
        query = query.order('trending_score', { ascending: false })
      }
      break
  }

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Search error:', error)
    return {
      results: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      query: filters.query,
      filters,
    }
  }

  // Transform results to flatten nested tag structure
  const results: SearchResult[] = (data ?? []).map((item) => ({
    ...item,
    creator: item.creator as unknown as SearchResult['creator'],
    category: item.category as unknown as SearchResult['category'],
    tags: (item.listing_tags as unknown as { tag: { id: string; name: string; slug: string } }[])?.map(
      (lt) => lt.tag
    ) ?? [],
  }))

  // If filtering by tags, do client-side filter (Supabase doesn't support junction table filtering easily)
  let filteredResults = results
  if (filters.tags && filters.tags.length > 0) {
    filteredResults = results.filter((r) =>
      filters.tags!.some((tagSlug) => r.tags.some((t) => t.slug === tagSlug))
    )
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return {
    results: filteredResults,
    total,
    page,
    limit,
    totalPages,
    query: filters.query,
    filters,
  }
}

export async function getPopularTags(limit = 20): Promise<{ name: string; slug: string; count: number }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listing_tags')
    .select('tag:tags(name, slug)')

  if (error || !data) return []

  const tagCounts = new Map<string, { name: string; slug: string; count: number }>()
  for (const item of data) {
    const tag = (item as unknown as { tag: { name: string; slug: string } }).tag
    if (!tag) continue
    const existing = tagCounts.get(tag.slug)
    if (existing) {
      existing.count++
    } else {
      tagCounts.set(tag.slug, { name: tag.name, slug: tag.slug, count: 1 })
    }
  }

  return Array.from(tagCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function getTrendingListings(limit = 10): Promise<SearchResult[]> {
  const response = await searchListings({ sort: 'trending', limit })
  return response.results
}

export async function getRelatedListings(listingId: string, type: string, limit = 6): Promise<SearchResult[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      slug,
      description,
      type,
      status,
      price,
      views,
      downloads,
      average_rating,
      review_count,
      trending_score,
      platform,
      images,
      created_at,
      updated_at,
      creator:users!listings_creator_id_fkey(id, name, avatar_url),
      category:categories!listings_category_id_fkey(id, name, slug),
      listing_tags(tag:tags(id, name, slug))
    `)
    .eq('status', 'ACTIVE')
    .eq('type', type)
    .neq('id', listingId)
    .order('trending_score', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((item) => ({
    ...item,
    creator: item.creator as unknown as SearchResult['creator'],
    category: item.category as unknown as SearchResult['category'],
    tags: (item.listing_tags as unknown as { tag: { id: string; name: string; slug: string } }[])?.map(
      (lt) => lt.tag
    ) ?? [],
  }))
}
