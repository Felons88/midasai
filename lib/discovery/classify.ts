import type { SupabaseClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"

const LISTING_TYPES = [
  "SKILL",
  "PLUGIN",
  "MCP",
  "AGENT",
  "PROMPT",
  "WORKFLOW",
  "TEMPLATE",
  "AUTOMATION",
  "DEVELOPER_TOOL",
] as const

export type RepositoryClassification = {
  primary_category: string | null
  secondary_categories: string[]
  tags: string[]
  difficulty: string | null
  target_audience: string[]
  supported_models: string[]
  supported_ides: string[]
  languages: string[]
  frameworks: string[]
  industries: string[]
  use_cases: string[]
  quality_score: number | null
  confidence_score: number | null
  marketplace_relevance: string | null
  related_repositories: string[]
}

export async function classifyRepository(
  repo: {
    full_name: string
    description: string | null
    topics: string[]
    primary_language: string | null
    readme_excerpt: string
  },
  categories: { name: string; slug: string }[]
): Promise<RepositoryClassification> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return fallbackClassification(repo)
  }

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const categoryList = categories.map((c) => c.name).join(", ")

  const prompt = `You are a marketplace classification engine for AI development resources.
Analyze this GitHub repository and return a single JSON object with these keys only:
{
  "primary_category": "exact category name from the allowed list",
  "secondary_categories": ["category1", "category2"],
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty": "beginner|intermediate|advanced",
  "target_audience": ["audience1"],
  "supported_models": ["Claude", "GPT-4", "Cursor", etc],
  "supported_ides": ["Cursor", "VS Code", "Windsurf", "Claude Code", etc],
  "languages": ["TypeScript", "Python", etc],
  "frameworks": ["Next.js", "React", etc],
  "industries": [" SaaS", "Healthcare", etc],
  "use_cases": ["use case 1", "use case 2"],
  "quality_score": 0-100,
  "confidence_score": 0.0-1.0,
  "marketplace_relevance": "high|medium|low",
  "related_repositories": ["owner/repo1", "owner/repo2"]
}

Allowed primary categories: ${categoryList}
Allowed types: ${LISTING_TYPES.join(", ")}

Repository: ${repo.full_name}
Description: ${repo.description ?? ""}
Language: ${repo.primary_language ?? "unknown"}
Topics: ${repo.topics.join(", ")}
README excerpt:
${repo.readme_excerpt.slice(0, 6000)}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallbackClassification(repo)
    const parsed = JSON.parse(jsonMatch[0]) as Partial<RepositoryClassification>

    return {
      primary_category: parsed.primary_category ?? null,
      secondary_categories: Array.isArray(parsed.secondary_categories) ? parsed.secondary_categories : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      difficulty: parsed.difficulty ?? null,
      target_audience: Array.isArray(parsed.target_audience) ? parsed.target_audience : [],
      supported_models: Array.isArray(parsed.supported_models) ? parsed.supported_models : [],
      supported_ides: Array.isArray(parsed.supported_ides) ? parsed.supported_ides : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages : [],
      frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
      use_cases: Array.isArray(parsed.use_cases) ? parsed.use_cases : [],
      quality_score: typeof parsed.quality_score === "number" ? parsed.quality_score : null,
      confidence_score: typeof parsed.confidence_score === "number" ? parsed.confidence_score : null,
      marketplace_relevance: parsed.marketplace_relevance ?? null,
      related_repositories: Array.isArray(parsed.related_repositories) ? parsed.related_repositories : [],
    }
  } catch {
    return fallbackClassification(repo)
  }
}

function fallbackClassification(repo: {
  full_name: string
  description: string | null
  topics: string[]
  primary_language: string | null
}): RepositoryClassification {
  const hay = `${repo.full_name} ${repo.description ?? ""} ${repo.topics.join(" ")}`.toLowerCase()
  const type = hay.includes("mcp")
    ? "MCP"
    : hay.includes("workflow")
      ? "WORKFLOW"
      : hay.includes("template")
        ? "TEMPLATE"
        : hay.includes("plugin")
          ? "PLUGIN"
          : hay.includes("agent")
            ? "AGENT"
            : hay.includes("prompt")
              ? "PROMPT"
              : "SKILL"

  return {
    primary_category: null,
    secondary_categories: [],
    tags: [...(repo.topics ?? []), repo.primary_language ?? "open-source"].filter(Boolean),
    difficulty: null,
    target_audience: [],
    supported_models: [],
    supported_ides: [],
    languages: repo.primary_language ? [repo.primary_language] : [],
    frameworks: [],
    industries: [],
    use_cases: [],
    quality_score: null,
    confidence_score: 0.1,
    marketplace_relevance: null,
    related_repositories: [],
  }
}

export async function classifyAndStoreRepository(
  service: SupabaseClient,
  repositoryId: string
): Promise<{ success: boolean; error: string | null }> {
  const { data: repo, error: repoError } = await service
    .from("discovered_repositories")
    .select("*")
    .eq("id", repositoryId)
    .single()

  if (repoError || !repo) {
    return { success: false, error: repoError?.message || "Repository not found" }
  }

  const { data: categories } = await service.from("categories").select("name, slug")

  const readmeExcerpt =
    (repo.metadata as Record<string, unknown>)?.readme_excerpt?.toString() ??
    (repo.metadata as Record<string, unknown>)?.readme?.toString() ??
    ""

  const classification = await classifyRepository(
    {
      full_name: repo.full_name,
      description: repo.description,
      topics: repo.topics ?? [],
      primary_language: repo.primary_language,
      readme_excerpt: readmeExcerpt,
    },
    categories ?? []
  )

  const { error: upsertError } = await service.from("repository_classifications").upsert(
    {
      repository_id: repo.id,
      ...classification,
      classified_at: new Date().toISOString(),
      classification_result: classification as Record<string, unknown>,
    },
    { onConflict: "repository_id" }
  )

  if (upsertError) {
    return { success: false, error: upsertError.message }
  }

  await service
    .from("discovered_repositories")
    .update({ quality_score: classification.quality_score })
    .eq("id", repo.id)

  return { success: true, error: null }
}
