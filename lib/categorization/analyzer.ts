import { generateAI } from "@/lib/ai/client"
import { OFFICIAL_CATEGORIES, type CategoryDefinition } from "./categories"
import { extractListingContent, type ExtractedContent } from "./extractor"

export interface CategoryAssignment {
  slug: string
  name: string
  confidence: number
  reason: string
  isPrimary: boolean
}

export interface CategorizationResult {
  categories: CategoryAssignment[]
  tags: string[]
  topics: string[]
  modelVersion: string
  reasoning: string
}

interface AIAssignment {
  slug: string
  confidence: number
  reason: string
}

interface AIResult {
  categories: AIAssignment[]
  tags: string[]
  topics: string[]
  reasoning: string
  modelVersion: string
}

const MODEL_VERSION = "categorizer-v1"

const systemPrompt = `You are an expert marketplace categorization engine for MidasAI, a marketplace for AI skills, agents, prompts, workflows, templates, and developer tools.

Analyze the provided listing and return a JSON object with exactly this shape:
{
  "categories": [
    { "slug": "react", "confidence": 98, "reason": "Detected React imports and JSX components" }
  ],
  "tags": ["react", "typescript", "frontend"],
  "topics": ["ui-components", "hooks"],
  "reasoning": "One-paragraph summary of why these categories were chosen",
  "modelVersion": "categorizer-v1"
}

Rules:
- Only use slugs from the provided official categories list.
- A listing may have multiple categories. Only assign categories you are confident about.
- Confidence must be 0-100. Only return categories with confidence >= 40.
- Always include the primary category first (isPrimary=true will be applied by the engine).
- Tags should be lowercase, kebab-case, and useful for search.
- Topics are broader themes (e.g., "frontend", "authentication", "ai-agents").
- Keep reasoning concise but evidence-based.
- If the listing is a Claude Code skill, Cursor rule, Codex agent, Windsurf workflow, ChatGPT prompt, or Gemini gem, include the corresponding assistant category.
- Infer intent from README, dependencies, file names, folder structure, and descriptions.
- Never invent categories outside the official list.
`

export function buildAnalyzerPrompt(
  content: ExtractedContent,
  officialCategories: CategoryDefinition[]
): string {
  const categoryList = officialCategories
    .map((c) => `- ${c.slug} (${c.name}): ${c.description}`)
    .join("\n")

  return `Official categories (use these slugs only):
${categoryList}

Listing content:
Title: ${content.title}
Description: ${content.description}
Short description: ${content.shortDescription ?? "N/A"}
Type: ${content.tags?.join(", ") ?? "N/A"}
Existing tags: ${content.tags?.join(", ") ?? "N/A"}
Existing topics: ${content.topics?.join(", ") ?? "N/A"}

README (truncated):
${content.readme ?? "N/A"}

File names: ${content.fileNames.join(", ")}

Folder structure:
${content.folderStructure || "N/A"}

Dependencies: ${content.dependencies.join(", ")}

Scripts: ${content.scripts.join(", ")}

File snippets:
${content.fileSnippets.join("\n---\n")}

AI assistant hints:
${content.aiAssistantHints.join("\n---\n")}

Return only the JSON object. Do not wrap in markdown code fences.`
}

export async function analyzeListing(
  listing: {
    title?: string | null
    description?: string | null
    short_description?: string | null
    readme?: string | null
    tags?: string[] | null
    topics?: string[] | null
    type?: string | null
    files?: unknown | null
    github_url?: string | null
  }
): Promise<CategorizationResult> {
  const content = extractListingContent(listing)
  const prompt = buildAnalyzerPrompt(content, OFFICIAL_CATEGORIES)

  const schema = {
    type: "object",
    properties: {
      categories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slug: { type: "string" },
            confidence: { type: "number" },
            reason: { type: "string" },
          },
          required: ["slug", "confidence", "reason"],
        },
      },
      tags: {
        type: "array",
        items: { type: "string" },
      },
      topics: {
        type: "array",
        items: { type: "string" },
      },
      reasoning: { type: "string" },
      modelVersion: { type: "string" },
    },
    required: ["categories", "tags", "topics", "reasoning", "modelVersion"],
  }

  const response = await generateAI<AIResult>(systemPrompt, prompt, {
    jsonMode: true,
    temperature: 0.2,
    maxTokens: 4096,
  }, schema)

  if (!response.data) {
    console.error("Categorization failed:", response.error)
    return fallbackCategorization(content)
  }

  const aiResult = response.data

  const validCategories = aiResult.categories
    .filter((a) => OFFICIAL_CATEGORIES.some((c) => c.slug === a.slug))
    .filter((a) => a.confidence >= 40)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8)
    .map((a, index) => {
      const category = OFFICIAL_CATEGORIES.find((c) => c.slug === a.slug)!
      return {
        slug: a.slug,
        name: category.name,
        confidence: Math.min(100, Math.max(0, a.confidence)),
        reason: a.reason,
        isPrimary: index === 0,
      }
    })

  const normalizedTags = normalizeTags(aiResult.tags)
  const normalizedTopics = normalizeTags(aiResult.topics)

  return {
    categories: validCategories,
    tags: normalizedTags,
    topics: normalizedTopics,
    modelVersion: aiResult.modelVersion || MODEL_VERSION,
    reasoning: aiResult.reasoning || "No reasoning provided",
  }
}

function fallbackCategorization(content: ExtractedContent): CategorizationResult {
  const categories: CategoryAssignment[] = []
  const text = [
    content.title,
    content.description,
    content.shortDescription,
    content.readme,
    ...content.fileNames,
    ...content.dependencies,
    ...content.topics,
    ...content.tags,
  ]
    .join(" ")
    .toLowerCase()

  for (const category of OFFICIAL_CATEGORIES) {
    const score = scoreCategory(category, text, content)
    if (score >= 60) {
      categories.push({
        slug: category.slug,
        name: category.name,
        confidence: score,
        reason: "Matched via keyword fallback",
        isPrimary: categories.length === 0,
      })
    }
  }

  categories.sort((a, b) => b.confidence - a.confidence)

  return {
    categories: categories.slice(0, 6),
    tags: normalizeTags(content.tags),
    topics: normalizeTags(content.topics),
    modelVersion: `${MODEL_VERSION}-fallback`,
    reasoning: "Keyword-based fallback categorization due to AI service failure.",
  }
}

function scoreCategory(category: CategoryDefinition, text: string, content: ExtractedContent): number {
  let score = 0
  const allTerms = [...category.keywords, ...category.aliases, category.name.toLowerCase(), category.slug.toLowerCase()]
  const matched = new Set<string>()

  for (const term of allTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`\\b${escaped}\\b`, "i")
    if (regex.test(text)) {
      matched.add(term)
      score += 12
    }
  }

  // Boost for assistant-specific files
  if (category.slug === "claude-code-skills" && content.fileNames.some((f) => f.toLowerCase().includes("claude.md"))) {
    score += 25
  }
  if (category.slug === "cursor-rules" && content.fileNames.some((f) => f.toLowerCase().includes(".cursorrules"))) {
    score += 25
  }
  if (category.slug === "windsurf-workflows" && content.fileNames.some((f) => f.toLowerCase().includes("windsurf"))) {
    score += 25
  }

  return Math.min(100, score)
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).filter(Boolean))].slice(0, 20)
}
