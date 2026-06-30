import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { applyListingSearch } from "@/lib/search/listings"
import { applyTagArrayFilter, resolveListingIdsForTag } from "@/lib/search/tags"
import { authenticateApiKey, logApiUsage } from "@/lib/api/api-key-auth"
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit"

export async function GET(request: NextRequest) {
  const started = Date.now()
  const apiKeyHeader = request.headers.get("x-api-key")
  let rateLimitHeadersToApply: Record<string, string> = {}
  let apiKeyCtx: Awaited<ReturnType<typeof authenticateApiKey>> | null = null

  if (apiKeyHeader) {
    apiKeyCtx = await authenticateApiKey(request)
    if (!apiKeyCtx.ok) {
      return apiKeyCtx.response
    }
    rateLimitHeadersToApply = rateLimitHeaders(apiKeyCtx.rateLimit)
  } else {
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() ?? "anonymous"
    const anonLimit = checkRateLimit(`search:ip:${ip}`, 120)
    rateLimitHeadersToApply = rateLimitHeaders(anonLimit)
    if (!anonLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429, headers: rateLimitHeadersToApply }
      )
    }
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category")
    const type = searchParams.get("type")
    const creator = searchParams.get("creator")
    const tags = searchParams.get("tags")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sort = searchParams.get("sort") || "relevance"
    const minRating = searchParams.get("minRating")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const supabase = await createClient()

    let tagListingIds: string[] | null = null
    if (tags) {
      tagListingIds = await resolveListingIdsForTag(supabase, tags)
    }

    const applyTagFilter = <T,>(dbQuery: T): T => {
      if (!tags) return dbQuery
      let q = dbQuery as { in: (col: string, ids: string[]) => T; contains: (col: string, val: string[]) => T }
      if (tagListingIds && tagListingIds.length > 0) {
        return q.in("id", tagListingIds)
      }
      return applyTagArrayFilter(dbQuery, tags)
    }

    const buildQuery = (searchMode?: "text" | "ilike") => {
      let dbQuery = supabase
        .from("listings")
        .select(`
          *,
          creator:users!listings_creator_id_fkey(id, name, avatar_url),
          reviews(rating)
        `)
        .eq("status", "ACTIVE")

      if (category) {
        dbQuery = dbQuery.eq("category_id", category)
      }

      if (type) {
        dbQuery = dbQuery.eq("type", type)
      }

      if (creator) {
        dbQuery = dbQuery.eq("creator_id", creator)
      }

      if (minPrice) {
        dbQuery = dbQuery.gte("price", parseFloat(minPrice))
      }

      if (maxPrice) {
        dbQuery = dbQuery.lte("price", parseFloat(maxPrice))
      }

      if (minRating && minRating !== "any") {
        dbQuery = dbQuery.gte("average_rating", parseFloat(minRating))
      }

      dbQuery = applyTagFilter(dbQuery)

      if (query && searchMode) {
        dbQuery = applyListingSearch(dbQuery, query, searchMode)
      }

      switch (sort) {
        case "price_asc":
          dbQuery = dbQuery.order("price", { ascending: true })
          break
        case "price_desc":
          dbQuery = dbQuery.order("price", { ascending: false })
          break
        case "newest":
          dbQuery = dbQuery.order("created_at", { ascending: false })
          break
        case "popular":
          dbQuery = dbQuery.order("downloads", { ascending: false })
          break
        case "rating":
          dbQuery = dbQuery.order("average_rating", { ascending: false, nullsFirst: false })
          break
        default:
          dbQuery = dbQuery.order("created_at", { ascending: false })
      }

      const offset = (page - 1) * limit
      return dbQuery.range(offset, offset + limit - 1)
    }

    const buildCountQuery = (searchMode?: "text" | "ilike") => {
      let countQuery = supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE")

      if (category) {
        countQuery = countQuery.eq("category_id", category)
      }

      if (type) {
        countQuery = countQuery.eq("type", type)
      }

      if (creator) {
        countQuery = countQuery.eq("creator_id", creator)
      }

      if (minPrice) {
        countQuery = countQuery.gte("price", parseFloat(minPrice))
      }

      if (maxPrice) {
        countQuery = countQuery.lte("price", parseFloat(maxPrice))
      }

      if (minRating && minRating !== "any") {
        countQuery = countQuery.gte("average_rating", parseFloat(minRating))
      }

      countQuery = applyTagFilter(countQuery)

      if (query && searchMode) {
        countQuery = applyListingSearch(countQuery, query, searchMode)
      }

      return countQuery
    }

    let searchMode: "text" | "ilike" | undefined = query ? "text" : undefined
    let { data: listings, error } = await buildQuery(searchMode)

    if (error && query) {
      console.warn("Full-text search failed, falling back to ilike:", error.message)
      searchMode = "ilike"
      ;({ data: listings, error } = await buildQuery("ilike"))
    }

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json(
        { success: false, error: "Search failed" },
        { status: 500, headers: rateLimitHeadersToApply }
      )
    }

    const { count } = await buildCountQuery(searchMode)

    const listingsWithRatings =
      listings?.map((listing: Record<string, unknown> & { reviews?: { rating: number }[] }) => {
        const ratings = listing.reviews?.map((r) => r.rating) || []
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
            : 0
        return {
          ...listing,
          average_rating: avgRating,
          review_count: ratings.length,
        }
      }) || []

    const latencyMs = Date.now() - started

    if (apiKeyCtx?.ok) {
      await logApiUsage(apiKeyCtx.ctx, request, "/api/search", 200, latencyMs)
    }

    return NextResponse.json(
      {
        success: true,
        listings: listingsWithRatings,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
        filters: {
          query,
          category,
          type,
          creator,
          tags,
          minPrice,
          maxPrice,
          sort,
        },
        latency: latencyMs,
      },
      {
        headers: {
          ...rateLimitHeadersToApply,
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          "X-Search-Latency": `${latencyMs}ms`,
        },
      }
    )
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500, headers: rateLimitHeadersToApply }
    )
  }
}
