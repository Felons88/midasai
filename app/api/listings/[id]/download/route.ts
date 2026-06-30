import { createClient, createServiceClient } from "@/lib/supabase/server"
import { checkBillingLimit, getBillingContext } from "@/lib/billing/entitlements"
import { getListingDelivery } from "@/lib/listings/delivery"
import { resolveDownloadUrl } from "@/lib/storage/signed-download"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, price, status, files, github_url")
      .eq("id", listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    if (listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing is not available" }, { status: 400 })
    }

    const price = Number(listing.price) || 0
    const service = createServiceClient()

    const billing = await getBillingContext(supabase, user.id)
    const downloadCheck = checkBillingLimit(billing, "downloads_monthly")

    if (!downloadCheck.allowed) {
      return NextResponse.json(
        { error: downloadCheck.message, code: downloadCheck.code },
        { status: 403 }
      )
    }

    if (price > 0) {
      const { data: purchase } = await service
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .eq("status", "COMPLETED")
        .maybeSingle()

      if (!purchase) {
        return NextResponse.json(
          { error: "Purchase required before download", code: "PURCHASE_REQUIRED" },
          { status: 403 }
        )
      }
    }

    const userAgent = request.headers.get("user-agent")
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded?.split(",")[0]?.trim() ?? null

    await service.from("downloads").insert({
      user_id: user.id,
      listing_id: listingId,
      user_agent: userAgent,
      ip_address: ipAddress,
    })

    const { data: currentListing } = await service
      .from("listings")
      .select("downloads")
      .eq("id", listingId)
      .single()

    await service
      .from("listings")
      .update({ downloads: (currentListing?.downloads ?? 0) + 1 })
      .eq("id", listingId)

    const files = listing.files as
      | { url?: string; download_url?: string; path?: string }[]
      | { url?: string; download_url?: string; path?: string }
      | null
    let downloadUrl: string | null = null
    let rawUrl: string | null = null

    if (Array.isArray(files) && (files[0]?.url || files[0]?.path)) {
      rawUrl = files[0].path ?? files[0].url ?? files[0].download_url ?? null
    } else if (files && !Array.isArray(files)) {
      rawUrl = files.path ?? files.url ?? files.download_url ?? null
    } else if (listing.github_url) {
      rawUrl = listing.github_url
    }

    if (rawUrl) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
      downloadUrl = await resolveDownloadUrl(service, rawUrl, supabaseUrl)
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      title: listing.title,
      delivery: getListingDelivery(listing.files, listing.github_url),
    })
  } catch (error) {
    console.error("Download API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
