import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export async function getOwnedListing(listingId: string, userId: string) {
  const supabase = await createClient()
  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, title, creator_id, type, status, description, price")
    .eq("id", listingId)
    .eq("creator_id", userId)
    .single()

  if (error || !listing) {
    return null
  }

  return listing
}

export async function requireOwnedListing(listingId: string, userId: string) {
  const listing = await getOwnedListing(listingId, userId)
  if (!listing) {
    notFound()
  }
  return listing
}
