import type { SupabaseClient } from "@supabase/supabase-js"
import { analyzeListing, type CategorizationResult } from "./analyzer"
import { slugifyTag } from "@/lib/listings/tags"

export interface CategorizationJob {
  id: string
  listing_id: string
  status: string
  priority: number
  attempt_count: number
  max_attempts: number
  error_message: string | null
  input_hash: string | null
  result: unknown | null
  created_at: string | null
  updated_at: string | null
  started_at: string | null
  completed_at: string | null
}

export async function queueCategorization(
  service: SupabaseClient,
  listingId: string,
  priority: number = 5
): Promise<{ job: CategorizationJob | null; error: string | null }> {
  const { data: listing, error: listingError } = await service
    .from("listings")
    .select("id, title, description, short_description, readme, tags, topics, type, files, github_url")
    .eq("id", listingId)
    .single()

  if (listingError || !listing) {
    return { job: null, error: listingError?.message || "Listing not found" }
  }

  const inputHash = computeInputHash(listing)

  const { data: existing } = await service
    .from("categorization_jobs")
    .select("id, status, input_hash")
    .eq("listing_id", listingId)
    .in("status", ["pending", "processing"])
    .maybeSingle()

  if (existing && existing.input_hash === inputHash) {
    return { job: existing as CategorizationJob, error: null }
  }

  const { data: job, error } = await service
    .from("categorization_jobs")
    .insert({
      listing_id: listingId,
      status: "pending",
      priority,
      input_hash: inputHash,
      attempt_count: 0,
      max_attempts: 3,
    })
    .select("*")
    .single()

  if (error) {
    return { job: null, error: error.message }
  }

  return { job: job as CategorizationJob, error: null }
}

export async function runCategorizationJob(
  service: SupabaseClient,
  jobId: string
): Promise<{ success: boolean; error: string | null }> {
  const { data: job, error: jobError } = await service
    .from("categorization_jobs")
    .select("*")
    .eq("id", jobId)
    .single()

  if (jobError || !job) {
    return { success: false, error: jobError?.message || "Job not found" }
  }

  if (job.status === "completed" || job.status === "failed") {
    return { success: true, error: null }
  }

  await service
    .from("categorization_jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      attempt_count: job.attempt_count + 1,
    })
    .eq("id", jobId)

  const { data: listing, error: listingError } = await service
    .from("listings")
    .select("id, title, description, short_description, readme, tags, topics, type, files, github_url, category_id")
    .eq("id", job.listing_id)
    .single()

  if (listingError || !listing) {
    await failJob(service, jobId, "Listing not found")
    return { success: false, error: "Listing not found" }
  }

  try {
    const result = await analyzeListing({
      title: listing.title,
      description: listing.description,
      short_description: listing.short_description,
      readme: listing.readme,
      tags: listing.tags ?? [],
      topics: listing.topics ?? [],
      type: listing.type,
      files: listing.files,
      github_url: listing.github_url,
    })

    await applyCategorizationResult(service, listing.id, result)

    await service.from("categorization_jobs").update({
      status: "completed",
      result: result as unknown as Record<string, unknown>,
      completed_at: new Date().toISOString(),
      error_message: null,
    }).eq("id", jobId)

    return { success: true, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Categorization failed"
    await failJob(service, jobId, message)
    return { success: false, error: message }
  }
}

async function failJob(service: SupabaseClient, jobId: string, message: string) {
  const { data: job } = await service
    .from("categorization_jobs")
    .select("attempt_count, max_attempts")
    .eq("id", jobId)
    .single()

  const attempts = (job?.attempt_count ?? 0) + 1
  const maxAttempts = job?.max_attempts ?? 3
  const status = attempts >= maxAttempts ? "failed" : "pending"

  await service.from("categorization_jobs").update({
    status,
    error_message: message,
    attempt_count: attempts,
  }).eq("id", jobId)
}

export async function applyCategorizationResult(
  service: SupabaseClient,
  listingId: string,
  result: CategorizationResult
): Promise<{ error: string | null }> {
  // Get existing category slugs
  const { data: existingCategories } = await service
    .from("categories")
    .select("id, slug")
    .in("slug", result.categories.map((c) => c.slug))

  const categoryMap = new Map(existingCategories?.map((c) => [c.slug, c.id]) ?? [])

  // Delete existing AI-generated categories that aren't manually overridden
  await service
    .from("listing_categories")
    .delete()
    .eq("listing_id", listingId)
    .eq("is_ai_generated", true)
    .eq("manual_override", false)

  // Insert new categories
  const primarySlug = result.categories[0]?.slug
  for (const assignment of result.categories) {
    const categoryId = categoryMap.get(assignment.slug)
    if (!categoryId) continue

    await service.from("listing_categories").insert({
      listing_id: listingId,
      category_id: categoryId,
      is_primary: assignment.slug === primarySlug,
      confidence: assignment.confidence,
      reason: assignment.reason,
      is_ai_generated: true,
      manual_override: false,
      model_version: result.modelVersion,
    })
  }

  // Update primary category_id on listing
  if (primarySlug) {
    const primaryCategoryId = categoryMap.get(primarySlug)
    if (primaryCategoryId) {
      await service
        .from("listings")
        .update({ category_id: primaryCategoryId })
        .eq("id", listingId)
    }
  }

  // Store analysis snapshot
  await service.from("listing_category_analysis").upsert(
    {
      listing_id: listingId,
      generated_tags: result.tags,
      generated_topics: result.topics,
      model_version: result.modelVersion,
    },
    { onConflict: "listing_id" }
  )

  // Sync generated tags
  const existingTagNames = new Set(result.tags.map((t) => t.toLowerCase()))
  const existingTags = listingId
    ? (await service.from("listings").select("tags").eq("id", listingId).single()).data?.tags ?? []
    : []

  const mergedTags = [
    ...new Set([...existingTags, ...result.tags]),
  ].filter((t) => t.length <= 30 && t.length >= 2)

  await service.from("listings").update({ tags: mergedTags }).eq("id", listingId)

  // Insert tag records into tags table
  for (const tag of result.tags) {
    const slug = slugifyTag(tag)
    if (!slug) continue

    const { data: existing } = await service
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (!existing) {
      const { data: created } = await service
        .from("tags")
        .insert({ name: tag, slug })
        .select("id")
        .single()

      if (created) {
        await service
          .from("listing_tags")
          .insert({ listing_id: listingId, tag_id: created.id })
          .select()
      }
    } else {
      const { data: link } = await service
        .from("listing_tags")
        .select("tag_id")
        .eq("listing_id", listingId)
        .eq("tag_id", existing.id)
        .maybeSingle()

      if (!link) {
        await service.from("listing_tags").insert({ listing_id: listingId, tag_id: existing.id })
      }
    }
  }

  return { error: null }
}

export async function bulkQueueCategorization(
  service: SupabaseClient,
  filters: { status?: string; type?: string; categorySlug?: string; limit?: number } = {}
): Promise<{ queued: number; error: string | null }> {
  let query = service
    .from("listings")
    .select("id")

  if (filters.status) {
    query = query.eq("status", filters.status)
  }
  if (filters.type) {
    query = query.eq("type", filters.type)
  }
  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data: listings, error } = await query

  if (error) {
    return { queued: 0, error: error.message }
  }

  let queued = 0
  for (const listing of listings ?? []) {
    const { error: queueError } = await queueCategorization(service, listing.id, 5)
    if (!queueError) queued++
  }

  return { queued, error: null }
}

export async function getNextPendingJob(service: SupabaseClient): Promise<CategorizationJob | null> {
  const { data } = await service
    .from("categorization_jobs")
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  return data as CategorizationJob | null
}

export async function getCategorizationStatus(service: SupabaseClient) {
  const { data: counts, error } = await service.rpc("get_categorization_status")

  if (error || !counts) {
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      error: error?.message || null,
    }
  }

  return {
    total: counts.total ?? 0,
    pending: counts.pending ?? 0,
    processing: counts.processing ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    error: null,
  }
}

function computeInputHash(listing: Record<string, unknown>): string {
  const relevant = {
    title: listing.title,
    description: listing.description,
    readme: listing.readme,
    tags: listing.tags,
    topics: listing.topics,
    type: listing.type,
  }
  const str = JSON.stringify(relevant)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(16)
}
