import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveSystemCreatorId } from "@/lib/ingestion/clawhub"

const GITHUB_SOURCE_TAG = "github-discovery"

export async function importRepositoryToListing(
  service: SupabaseClient,
  repositoryId: string
): Promise<{ listingId: string | null; error: string | null }> {
  const { data: repo, error: repoError } = await service
    .from("discovered_repositories")
    .select("*, repository_classifications(*)")
    .eq("id", repositoryId)
    .single()

  if (repoError || !repo) {
    return { listingId: null, error: repoError?.message || "Repository not found" }
  }

  const classification = repo.repository_classifications as {
    id: string
    primary_category: string | null
    tags: string[] | null
  } | null

  let categoryId: string | null = null
  if (classification?.primary_category) {
    const { data: category } = await service
      .from("categories")
      .select("id")
      .or(`name.ilike.${classification.primary_category},slug.ilike.${classification.primary_category.toLowerCase().replace(/\s+/g, "-")}`)
      .maybeSingle()
    if (category?.id) categoryId = category.id
  }

  const { data: existing } = await service
    .from("listings")
    .select("id")
    .eq("github_url", repo.html_url)
    .maybeSingle()

  if (existing?.id) {
    return { listingId: existing.id, error: "Listing already exists" }
  }

  let creatorId: string
  try {
    creatorId = await resolveSystemCreatorId(service)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resolve system creator"
    return { listingId: null, error: message }
  }

  const title = repo.name
  const description = repo.description ?? ""
  const readme = [
    `# ${repo.name}`,
    "",
    repo.description ?? "",
    "",
    `**Source:** [GitHub](${repo.html_url})`,
    `**Owner:** [@${repo.owner}](${repo.owner_html_url})`,
    `**Stars:** ${repo.stargazers_count} · **Forks:** ${repo.forks_count}`,
    "",
    repo.topics?.length ? `**Topics:** ${repo.topics.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")

  const tags = [
    GITHUB_SOURCE_TAG,
    "github",
    "open-source",
    ...(classification?.tags ?? []),
    ...(repo.topics ?? []),
    repo.primary_language ?? "",
  ].filter(Boolean)

  const { data: listing, error: insertError } = await service
    .from("listings")
    .insert({
      creator_id: creatorId,
      title,
      description: description.slice(0, 250),
      type: "SKILL",
      status: "PENDING",
      price: 0,
      slug: `github-${repo.owner}-${repo.name}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      tags,
      topics: repo.topics ?? [],
      github_url: repo.html_url,
      readme,
      license: repo.license ?? null,
      category_id: categoryId,
      downloads: 0,
      files: {
        source: GITHUB_SOURCE_TAG,
        owner: repo.owner,
        repo: repo.name,
        branch: repo.default_branch,
        github_id: repo.github_id,
      } as Record<string, unknown>,
    })
    .select("id")
    .single()

  if (insertError || !listing) {
    return { listingId: null, error: insertError?.message || "Insert failed" }
  }

  await service
    .from("discovered_repositories")
    .update({ status: "imported" })
    .eq("id", repo.id)

  await service
    .from("import_queue")
    .update({ listing_id: listing.id, status: "approved" })
    .eq("repository_id", repo.id)

  return { listingId: listing.id, error: null }
}
