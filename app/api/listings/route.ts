import { createClient, createServiceClient } from "@/lib/supabase/server"
import { checkBillingLimit, getBillingContext } from "@/lib/billing/entitlements"
import { logActivity } from "@/lib/activity/feed"
import { seedInstallCommands } from "@/lib/creator/seed-install-commands"
import { syncListingTags } from "@/lib/listings/tags"
import { queueCategorization } from "@/lib/categorization/service"
import { NextResponse } from "next/server"
import { z } from "zod"

const createListingSchema = z.object({
  title: z.string().min(1).max(200),
  seo_title: z.string().min(1).max(200).optional().nullable(),
  description: z.string().min(1).max(5000),
  short_description: z.string().min(1).max(250).optional().nullable(),
  category_slug: z.string().min(1).max(100).optional().nullable(),
  type: z.string().min(1),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  github_url: z.string().url().optional().nullable(),
  readme: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  topics: z.array(z.string()).optional(),
  license: z.string().optional().nullable(),
  images: z.array(z.string().url()).max(12).optional(),
  scanResult: z
    .object({
      supported_platforms: z.array(z.string()).optional(),
      installation_steps: z.union([z.array(z.string()), z.record(z.string())]).optional(),
    })
    .optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createListingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const billing = await getBillingContext(supabase, user.id)
  const limitCheck = checkBillingLimit(billing, "listings")

  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message, code: limitCheck.code },
      { status: 403 }
    )
  }

  const payload = parsed.data
  const service = createServiceClient()

  let categoryId: string | null = null
  if (payload.category_slug) {
    const { data: category } = await service
      .from("categories")
      .select("id")
      .eq("slug", payload.category_slug)
      .maybeSingle()
    categoryId = category?.id ?? null
  }

  const { data: listing, error } = await service
    .from("listings")
    .insert({
      creator_id: user.id,
      category_id: categoryId,
      title: payload.title,
      seo_title: payload.seo_title ?? null,
      description: payload.description,
      short_description: payload.short_description ?? null,
      type: payload.type,
      tags: payload.tags ?? [],
      price: payload.price ?? 0,
      github_url: payload.github_url ?? null,
      status: "PENDING",
      readme: payload.readme ?? null,
      language: payload.language ?? null,
      topics: payload.topics ?? null,
      license: payload.license ?? null,
      images: payload.images ?? [],
    })
    .select("id, title")
    .single()

  if (error) {
    console.error("Listing create error:", error)
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }

  if (listing?.id && (payload.tags?.length ?? 0) > 0) {
    await syncListingTags(service, listing.id, payload.tags ?? [])
  }

  if (payload.scanResult && listing?.id) {
    const steps = payload.scanResult.installation_steps
    const installationSteps = Array.isArray(steps)
      ? steps
      : steps
        ? Object.values(steps)
        : undefined

    await seedInstallCommands(service, {
      listingId: listing.id,
      supportedPlatforms: payload.scanResult.supported_platforms,
      installationSteps,
      githubUrl: payload.github_url ?? undefined,
    })
  }

  // Queue AI categorization as a background job
  if (listing?.id) {
    await queueCategorization(service, listing.id, 10).catch((err) => {
      console.error("Failed to queue categorization for listing:", listing.id, err)
    })
  }

  await logActivity(
    {
      actorId: user.id,
      eventType: "listing_created",
      entityType: "listing",
      entityId: listing.id,
      entityTitle: listing.title,
    },
    service
  )

  return NextResponse.json({ listing }, { status: 201 })
}
