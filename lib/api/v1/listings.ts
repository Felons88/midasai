import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/server"
import { authenticateApiKey } from "@/lib/api/api-key-auth"
import { rateLimitHeaders } from "@/lib/api/rate-limit"
import { jsonError, jsonOk, requirePermission, scheduleUsageLog } from "@/lib/api/v1/shared"

const LISTINGS_CACHE_SECONDS = 30

const PUBLIC_LISTING_FIELDS = `
  id,
  title,
  description,
  type,
  price,
  slug,
  images,
  downloads,
  views,
  average_rating,
  review_count,
  tags,
  topics,
  status,
  created_at,
  updated_at,
  creator:users!listings_creator_id_fkey(id, name, avatar_url, github_username)
`

type ListingsQuery = {
  page: number
  limit: number
  type: string | null
}

async function queryActiveListings({ page, limit, type }: ListingsQuery) {
  const offset = (page - 1) * limit
  const supabase = createServiceClient()

  let query = supabase
    .from("listings")
    .select(PUBLIC_LISTING_FIELDS, { count: "planned" })
    .eq("status", "ACTIVE")

  if (type) {
    query = query.eq("type", type)
  }

  return query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
}

function getCachedListings(params: ListingsQuery) {
  const cacheKey = `v1-listings:${params.page}:${params.limit}:${params.type ?? "all"}`
  return unstable_cache(
    async () => queryActiveListings(params),
    [cacheKey],
    { revalidate: LISTINGS_CACHE_SECONDS, tags: ["v1-listings"] }
  )()
}

async function queryListingById(id: string) {
  const supabase = createServiceClient()
  return supabase
    .from("listings")
    .select(PUBLIC_LISTING_FIELDS)
    .eq("id", id)
    .eq("status", "ACTIVE")
    .maybeSingle()
}

function getCachedListingById(id: string) {
  return unstable_cache(
    async () => queryListingById(id),
    [`v1-listing:${id}`],
    { revalidate: LISTINGS_CACHE_SECONDS, tags: ["v1-listings", `v1-listing:${id}`] }
  )()
}

const createListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  type: z.enum(["SKILL", "WORKFLOW", "TEMPLATE", "PLUGIN", "MCP", "AGENT", "PROMPT"]).optional(),
  price: z.number().min(0).optional(),
  tags: z.array(z.string()).max(30).optional(),
  topics: z.array(z.string()).max(20).optional(),
  github_url: z.string().url().optional().nullable(),
})

const updateListingSchema = createListingSchema.partial()

export async function handleV1ListingsPost(request: NextRequest) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "write", auth.rateLimit)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400, auth.rateLimit)
  }

  const parsed = createListingSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError("Invalid input", 400, auth.rateLimit)
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("listings")
    .insert({
      creator_id: auth.ctx.userId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type ?? "SKILL",
      status: "PENDING",
      price: parsed.data.price ?? 0,
      tags: parsed.data.tags ?? [],
      topics: parsed.data.topics ?? [],
      images: [],
      github_url: parsed.data.github_url ?? null,
    })
    .select("id, title, status, created_at")
    .single()

  if (error) {
    scheduleUsageLogLocal(auth.ctx, request, "/v1/listings", 500, Date.now() - started)
    return jsonError("Failed to create listing", 500, auth.rateLimit)
  }

  scheduleUsageLogLocal(auth.ctx, request, "/v1/listings", 201, Date.now() - started)
  return jsonOk({ data }, auth.rateLimit, undefined, 201)
}

export async function handleV1ListingByIdPut(request: NextRequest, id: string) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "write", auth.rateLimit)
  if (denied) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400, auth.rateLimit)
  }

  const parsed = updateListingSchema.safeParse(body)
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return jsonError("Invalid input", 400, auth.rateLimit)
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("listings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", auth.ctx.userId)
    .select(PUBLIC_LISTING_FIELDS)
    .maybeSingle()

  if (error || !data) {
    scheduleUsageLogLocal(auth.ctx, request, `/v1/listings/${id}`, 404, Date.now() - started)
    return jsonError("Listing not found or not owned by you", 404, auth.rateLimit)
  }

  scheduleUsageLogLocal(auth.ctx, request, `/v1/listings/${id}`, 200, Date.now() - started)
  return jsonOk({ data }, auth.rateLimit)
}

export async function handleV1ListingByIdDelete(request: NextRequest, id: string) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)
  if (!auth.ok) return auth.response

  const denied = requirePermission(auth.ctx, "delete", auth.rateLimit)
  if (denied) return denied

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "ARCHIVED", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("creator_id", auth.ctx.userId)
    .select("id, status")
    .maybeSingle()

  if (error || !data) {
    scheduleUsageLogLocal(auth.ctx, request, `/v1/listings/${id}`, 404, Date.now() - started)
    return jsonError("Listing not found or not owned by you", 404, auth.rateLimit)
  }

  scheduleUsageLogLocal(auth.ctx, request, `/v1/listings/${id}`, 200, Date.now() - started)
  return jsonOk({ data }, auth.rateLimit)
}

export async function handleV1ListingsGet(request: NextRequest) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
    const type = searchParams.get("type")

    const { data, error, count } = await getCachedListings({ page, limit, type })

    if (error) {
      console.error("[v1/listings] query error:", error)
      const response = NextResponse.json(
        { error: "Failed to fetch listings" },
        { status: 500, headers: rateLimitHeaders(auth.rateLimit) }
      )
      scheduleUsageLogLocal(auth.ctx, request, "/v1/listings", 500, Date.now() - started)
      return response
    }

    const response = NextResponse.json(
      {
        data: data ?? [],
        pagination: {
          page,
          limit,
          total: count ?? 0,
          total_pages: count ? Math.ceil(count / limit) : 0,
        },
      },
      {
        headers: {
          ...rateLimitHeaders(auth.rateLimit),
          "Cache-Control": `public, s-maxage=${LISTINGS_CACHE_SECONDS}, stale-while-revalidate=60`,
        },
      }
    )

    scheduleUsageLog(auth.ctx, request, "/v1/listings", 200, Date.now() - started)
    return response
  } catch (error) {
    console.error("[v1/listings] unexpected error:", error)
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 })
    scheduleUsageLog(auth.ctx, request, "/v1/listings", 500, Date.now() - started)
    return response
  }
}

export async function handleV1ListingByIdGet(request: NextRequest, id: string) {
  const started = Date.now()
  const auth = await authenticateApiKey(request)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const { data, error } = await getCachedListingById(id)

    if (error) {
      console.error("[v1/listings/:id] query error:", error)
      const response = NextResponse.json(
        { error: "Failed to fetch listing" },
        { status: 500, headers: rateLimitHeaders(auth.rateLimit) }
      )
      scheduleUsageLog(auth.ctx, request, `/v1/listings/${id}`, 500, Date.now() - started)
      return response
    }

    if (!data) {
      const response = NextResponse.json(
        { error: "Listing not found" },
        { status: 404, headers: rateLimitHeaders(auth.rateLimit) }
      )
      scheduleUsageLog(auth.ctx, request, `/v1/listings/${id}`, 404, Date.now() - started)
      return response
    }

    const response = NextResponse.json(
      { data },
      {
        headers: {
          ...rateLimitHeaders(auth.rateLimit),
          "Cache-Control": `public, s-maxage=${LISTINGS_CACHE_SECONDS}, stale-while-revalidate=60`,
        },
      }
    )
    scheduleUsageLog(auth.ctx, request, `/v1/listings/${id}`, 200, Date.now() - started)
    return response
  } catch (error) {
    console.error("[v1/listings/:id] unexpected error:", error)
    const response = NextResponse.json({ error: "Internal server error" }, { status: 500 })
    scheduleUsageLog(auth.ctx, request, `/v1/listings/${id}`, 500, Date.now() - started)
    return response
  }
}
