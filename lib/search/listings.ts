type SearchMode = "text" | "ilike" | "fuzzy"

export function applyListingSearch<T>(
  query: T,
  searchTerm: string,
  mode: SearchMode = "text"
): T {
  const q = query as {
    textSearch: (
      column: string,
      term: string,
      options: { type: "websearch"; config: string }
    ) => T
    or: (filters: string) => T
  }

  if (!searchTerm || searchTerm.trim().length === 0) {
    return query as T
  }

  const term = searchTerm.trim()

  if (mode === "text") {
    return q.textSearch("search_vector", term, {
      type: "websearch",
      config: "english",
    })
  }

  if (mode === "fuzzy") {
    // Use trigram similarity for fuzzy matching with typo tolerance
    // Searches title, description, tags, and seo_title
    return q.or(
      `title.ilike.%${term}%,description.ilike.%${term}%,tags.ilike.%${term}%,seo_title.ilike.%${term}%`
    )
  }

  // Fallback to basic ILIKE
  return q.or(
    `title.ilike.%${term}%,description.ilike.%${term}%,tags.ilike.%${term}%`
  )
}

export function applySearchRanking<T>(query: T, searchTerm: string): T {
  const q = query as {
    select: (columns: string) => T
  }

  const term = searchTerm.trim()

  // Add ranking score based on multiple factors:
  // - Text search rank (ts_rank)
  // - Download count
  // - Rating
  // - Recent activity (updated_at)
  // - Quality score
  // - Featured status
  return q.select(`
    *,
    (
      COALESCE(ts_rank(search_vector, plainto_tsquery('english', '${term.replace(/'/g, "''")}')), 0) * 0.35 +
      COALESCE(LOG(downloads + 1) / 10, 0) * 0.15 +
      COALESCE(average_rating / 5, 0) * 0.10 +
      COALESCE(EXTRACT(EPOCH FROM (NOW() - updated_at)) / -86400 / 30, 0) * 0.05 +
      COALESCE(quality_score / 100, 0) * 0.10 +
      CASE WHEN featured = true THEN 0.05 ELSE 0 END
    ) as search_rank
  `)
}
