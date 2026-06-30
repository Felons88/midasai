import { createClient } from "@supabase/supabase-js"

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const id = "57cd67d1-dda6-49d7-8e23-e0beedeca202"
const select = `
  *,
  users!listings_creator_id_fkey(id, name, avatar_url),
  reviews(
    id, rating, comment, created_at, user_id,
    users(name, avatar_url),
    review_responses(id, response, updated_at)
  ),
  listing_faqs(id, question, answer, sort_order, published),
  listing_install_commands(id, platform, command, description, prerequisites, sort_order),
  listing_versions(id, version_name, version_number, changelog, created_at, file_size),
  categories(name, slug)
`

const { data, error } = await sb.from("listings").select(select).eq("id", id).single()
if (error) {
  console.error("QUERY ERROR:", error)
  process.exit(1)
}
console.log("OK:", data.title, "users:", data.users, "reviews:", data.reviews?.length)
