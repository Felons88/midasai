import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  buildGitHubRepoPreviewImages,
  extractReadmeImageUrls,
  mergeRepoImageCandidates,
} from "@/lib/github/repo-images"
import { githubFetch } from "@/lib/github/connection"
import { truncateText } from "@/lib/listings/normalize"
import type { GitHubConnection } from "@/lib/github/connection"

type GitHubRepo = {
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  topics?: string[]
  license?: { name: string } | null
  fork: boolean
  owner: { login: string; avatar_url?: string }
  stargazers_count: number
  forks_count: number
  default_branch?: string
}

const LISTING_TYPES = ["SKILL", "WORKFLOW", "TEMPLATE", "PLUGIN", "MCP", "AGENT", "PROMPT"] as const

function detectType(repo: GitHubRepo, topics: string[]): string {
  const hay = `${repo.name} ${repo.description ?? ""} ${topics.join(" ")}`.toLowerCase()
  if (hay.includes("mcp")) return "MCP"
  if (hay.includes("workflow")) return "WORKFLOW"
  if (hay.includes("template")) return "TEMPLATE"
  if (hay.includes("plugin")) return "PLUGIN"
  if (hay.includes("agent")) return "AGENT"
  if (hay.includes("prompt")) return "PROMPT"
  return "SKILL"
}

function buildTags(repo: GitHubRepo): string[] {
  const tags = new Set<string>()
  if (repo.language) tags.add(repo.language.toLowerCase())
  for (const topic of repo.topics ?? []) tags.add(topic.toLowerCase())
  tags.add("open-source")
  return Array.from(tags).slice(0, 10)
}

async function fetchReadme(token: string, fullName: string): Promise<string> {
  try {
    const data = await githubFetch<{ content?: string }>(
      token,
      `/repos/${fullName}/readme`
    )
    if (!data.content) return ""
    return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 12_000)
  } catch {
    return ""
  }
}

async function analyzeWithGemini(repo: GitHubRepo, readme: string) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `Analyze this GitHub repo for an AI marketplace listing. Return JSON only with keys:
title, seo_title (max 60 chars, optimized for search), description (full detailed description), short_description (max 250 chars, SEO-friendly), type (one of ${LISTING_TYPES.join(", ")}), tags (string array max 8), supported_platforms (string array), installation_steps (string array max 5).

Repo: ${repo.full_name}
Description: ${repo.description ?? ""}
Language: ${repo.language ?? "unknown"}
Topics: ${(repo.topics ?? []).join(", ")}
README excerpt:
${readme.slice(0, 4000)}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0]) as {
      title?: string
      seo_title?: string
      description?: string
      short_description?: string
      type?: string
      tags?: string[]
      supported_platforms?: string[]
      installation_steps?: string[]
    }
  } catch {
    return null
  }
}

export async function scanGitHubRepository(
  connection: GitHubConnection,
  repoFullName: string
) {
  const repo = await githubFetch<GitHubRepo>(
    connection.github_access_token,
    `/repos/${repoFullName}`
  )

  if (repo.owner.login !== connection.github_username) {
    throw new Error("You can only upload repositories that you own")
  }

  if (repo.fork) {
    throw new Error("Forked repositories cannot be uploaded")
  }

  const readme = await fetchReadme(connection.github_access_token, repoFullName)
  const ai = await analyzeWithGemini(repo, readme)
  const fallbackTags = buildTags(repo)
  const type = ai?.type && LISTING_TYPES.includes(ai.type as (typeof LISTING_TYPES)[number])
    ? ai.type
    : detectType(repo, repo.topics ?? [])

  const [owner, repoName] = repo.full_name.split("/")
  const defaultBranch = repo.default_branch ?? "main"
  const suggested_images = mergeRepoImageCandidates(
    buildGitHubRepoPreviewImages(owner, repoName, repo.owner.avatar_url),
    extractReadmeImageUrls(readme, owner, repoName, defaultBranch)
  )

  const title = ai?.title || repo.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const description =
    ai?.description ||
    repo.description ||
    `Open-source ${type.toLowerCase()} from ${repo.full_name}`
  const short_description = ai?.short_description || truncateText(description, 250)
  const seo_title = ai?.seo_title || title

  return {
    title,
    seo_title,
    description,
    short_description,
    type,
    tags: ai?.tags?.length ? ai.tags.slice(0, 10) : fallbackTags,
    price: "",
    github_url: repo.html_url,
    readme,
    supported_platforms: ai?.supported_platforms ?? ["GitHub"],
    installation_steps: ai?.installation_steps ?? [
      `Clone ${repo.html_url}`,
      "Follow the README instructions to install",
    ],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    suggested_images,
  }
}
