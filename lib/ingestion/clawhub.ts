import type { SupabaseClient } from "@supabase/supabase-js"

const CLAWHUB_ORIGIN = "https://clawhub.ai"
const CLAWHUB_API = `${CLAWHUB_ORIGIN}/api/v1/skills`
const CLAWHUB_SOURCE_TAG = "clawhub"

export const SYSTEM_CREATOR_NAME = "@SYSTEM"
export const SYSTEM_CREATOR_SLUG = "system"

const USER_AGENT = "MidasAI-ClawHub-Scraper/1.0"
const LISTING_DESCRIPTION_MAX = 250

function truncateListingDescription(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= LISTING_DESCRIPTION_MAX) return trimmed
  return `${trimmed.slice(0, LISTING_DESCRIPTION_MAX - 1).trimEnd()}…`
}
const MAX_FETCH_ATTEMPTS = 6
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504])

function retryDelayMs(res: Response, attempt: number): number {
  const header = res.headers.get("Retry-After")
  if (header) {
    const seconds = Number(header)
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000
  }
  // Exponential backoff: 2s, 4s, 8s, 16s, 32s…
  return Math.min(32_000, 2000 * 2 ** attempt)
}

async function clawHubFetch(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    cache: "no-store",
  })

  if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_FETCH_ATTEMPTS) {
    await new Promise((r) => setTimeout(r, retryDelayMs(res, attempt)))
    return clawHubFetch(url, attempt + 1)
  }

  return res
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

export type ClawHubSkill = {
  slug: string
  displayName: string
  summary: string
  description?: string
  topics?: string[]
  tags: Record<string, string>
  stats: {
    downloads?: number
    stars?: number
    installsCurrent?: number
  }
  latestVersion?: {
    version: string
    changelog?: string
    license?: string | null
  }
  ownerHandle?: string
}

export type ClawHubSkillDetail = {
  skill: ClawHubSkill
  latestVersion?: ClawHubSkill["latestVersion"]
  metadata?: { os?: string[]; systems?: string[] } | null
  owner?: { handle?: string; displayName?: string; image?: string | null }
}

export type ParsedClawHubSkill = {
  slug: string
  name: string
  description: string
  installSteps: Array<{
    platform: "CLI" | "MANUAL"
    command: string
    description: string
    sortOrder: number
  }>
  sourceUrl: string
  ownerHandle?: string
  version?: string
  topics: string[]
  changelog?: string
  license?: string | null
}

type ClawHubListResponse = {
  items: ClawHubSkill[]
  nextCursor?: string
}

export async function fetchClawHubSkillsPage(
  cursor?: string,
  limit = 50
): Promise<ClawHubListResponse> {
  const url = new URL(CLAWHUB_API)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("sort", "createdAt")
  url.searchParams.set("nonSuspiciousOnly", "true")
  if (cursor) url.searchParams.set("cursor", cursor)

  const res = await clawHubFetch(url.toString())

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(
      `ClawHub API error: ${res.status}${body ? ` — ${body.slice(0, 120)}` : ""}`
    )
  }

  return res.json() as Promise<ClawHubListResponse>
}

export async function fetchClawHubSkillDetail(slug: string): Promise<ClawHubSkillDetail | null> {
  const url = `${CLAWHUB_ORIGIN}/api/v1/skills/${encodeURIComponent(slug)}`
  const res = await clawHubFetch(url)
  if (!res.ok) return null
  return res.json() as Promise<ClawHubSkillDetail>
}

export function clawHubSourceUrl(slug: string) {
  return `${CLAWHUB_ORIGIN}/skills/${slug}`
}

export function clawHubListingSlug(slug: string) {
  return `clawhub-${slug}`
}

/** Parse name, description, and install steps from ClawHub skill metadata. */
export function parseClawHubSkill(
  skill: ClawHubSkill,
  detail?: ClawHubSkillDetail | null
): ParsedClawHubSkill {
  const merged: ClawHubSkill = detail?.skill
    ? { ...skill, ...detail.skill, latestVersion: detail.latestVersion ?? skill.latestVersion }
    : skill

  const name = (merged.displayName || merged.slug).trim()
  const description = (
    merged.description ||
    merged.summary ||
    detail?.skill?.summary ||
    ""
  ).trim()

  const ownerHandle = detail?.owner?.handle ?? merged.ownerHandle
  const version = merged.latestVersion?.version

  const installSteps: ParsedClawHubSkill["installSteps"] = [
    {
      platform: "CLI",
      command: `clawhub install ${merged.slug}`,
      description: "Install from ClawHub registry (OpenClaw)",
      sortOrder: 0,
    },
    {
      platform: "MANUAL",
      command: clawHubSourceUrl(merged.slug),
      description: "Open skill page on ClawHub for manual setup",
      sortOrder: 1,
    },
  ]

  return {
    slug: merged.slug,
    name,
    description,
    installSteps,
    sourceUrl: clawHubSourceUrl(merged.slug),
    ownerHandle: ownerHandle ?? undefined,
    version,
    topics: merged.topics ?? [],
    changelog: merged.latestVersion?.changelog,
    license: merged.latestVersion?.license ?? null,
  }
}

async function resolveSystemCreatorId(service: SupabaseClient): Promise<string> {
  const envId =
    process.env.SYSTEM_IMPORT_CREATOR_ID?.trim() ||
    process.env.CLAWHUB_IMPORT_CREATOR_ID?.trim()
  if (envId) return envId

  const email =
    process.env.SYSTEM_IMPORT_CREATOR_EMAIL?.trim() ||
    process.env.CLAWHUB_IMPORT_CREATOR_EMAIL?.trim() ||
    "system@midasai.tech"

  const { data: byName } = await service
    .from("users")
    .select("id")
    .eq("name", SYSTEM_CREATOR_NAME)
    .maybeSingle()
  if (byName?.id) return byName.id

  const { data: byEmail } = await service.from("users").select("id").eq("email", email).maybeSingle()
  if (byEmail?.id) {
    await service
      .from("users")
      .update({ name: SYSTEM_CREATOR_NAME, role: "CREATOR" })
      .eq("id", byEmail.id)
    await ensureSystemCreatorProfile(service, byEmail.id)
    return byEmail.id
  }

  const { data: created, error } = await service.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name: SYSTEM_CREATOR_NAME, role: "CREATOR" },
  })

  if (error || !created.user) {
    throw new Error("Failed to resolve @SYSTEM import user")
  }

  await service.from("users").upsert({
    id: created.user.id,
    email,
    name: SYSTEM_CREATOR_NAME,
    role: "CREATOR",
  })

  await ensureSystemCreatorProfile(service, created.user.id)
  return created.user.id
}

async function ensureSystemCreatorProfile(service: SupabaseClient, userId: string) {
  const { data: existing } = await service
    .from("creators")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (existing?.id) {
    await service
      .from("creators")
      .update({ display_name: SYSTEM_CREATOR_NAME, slug: SYSTEM_CREATOR_SLUG })
      .eq("user_id", userId)
    return
  }

  await service.from("creators").insert({
    user_id: userId,
    display_name: SYSTEM_CREATOR_NAME,
    slug: SYSTEM_CREATOR_SLUG,
    bio: "Automated marketplace imports",
    verified: true,
  })
}

export type ClawHubImportResult = {
  imported: number
  skipped: number
  errors: string[]
  hasMore: boolean
  nextCursor: string | null
  samples: ParsedClawHubSkill[]
}

export async function importClawHubSkills(
  service: SupabaseClient,
  options: {
    limit?: number
    cursor?: string
    status?: "PENDING" | "ACTIVE"
    fetchDetail?: boolean
  } = {}
): Promise<ClawHubImportResult> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 25))
  const page = await fetchClawHubSkillsPage(options.cursor, limit)
  const creatorId = await resolveSystemCreatorId(service)

  let imported = 0
  let skipped = 0
  const errors: string[] = []
  const samples: ParsedClawHubSkill[] = []

  for (const skill of page.items) {
    try {
      let detail: ClawHubSkillDetail | null = null
      if (options.fetchDetail) {
        detail = await fetchClawHubSkillDetail(skill.slug)
        // Throttle detail requests to avoid ClawHub 503/rate limits
        await sleep(350)
      }

      const parsed = parseClawHubSkill(skill, detail)

      if (!parsed.description) {
        skipped++
        continue
      }

      const listingSlug = clawHubListingSlug(parsed.slug)

      const { data: existing } = await service
        .from("listings")
        .select("id")
        .or(`slug.eq.${listingSlug},github_url.eq.${parsed.sourceUrl}`)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      const readme = [
        `# ${parsed.name}`,
        "",
        parsed.description,
        "",
        `**Source:** [ClawHub](${parsed.sourceUrl})`,
        parsed.ownerHandle ? `**Publisher:** @${parsed.ownerHandle}` : "",
        parsed.version ? `**Version:** ${parsed.version}` : "",
        "",
        "## Install",
        "",
        ...parsed.installSteps.map(
          (step) => `- **${step.platform}:** \`${step.command}\` — ${step.description}`
        ),
        "",
        parsed.changelog ? `## Changelog\n\n${parsed.changelog}` : "",
      ]
        .filter(Boolean)
        .join("\n")

      const tags = [
        CLAWHUB_SOURCE_TAG,
        "openclaw",
        "skill",
        ...parsed.topics.slice(0, 8),
      ]

      const { data: listing, error } = await service
        .from("listings")
        .insert({
          creator_id: creatorId,
          title: parsed.name,
          description: truncateListingDescription(parsed.description),
          type: "SKILL",
          status: options.status ?? "PENDING",
          price: 0,
          slug: listingSlug,
          tags,
          topics: parsed.topics,
          github_url: parsed.sourceUrl,
          readme,
          license: parsed.license ?? null,
          downloads: skill.stats?.downloads ?? 0,
          files: {
            source: CLAWHUB_SOURCE_TAG,
            external_slug: parsed.slug,
            source_url: parsed.sourceUrl,
            owner_handle: parsed.ownerHandle ?? null,
            version: parsed.version ?? null,
            imported_by: SYSTEM_CREATOR_NAME,
          },
        })
        .select("id")
        .single()

      if (error || !listing) {
        errors.push(`${parsed.slug}: ${error?.message ?? "insert failed"}`)
        continue
      }

      await service.from("listing_install_commands").insert(
        parsed.installSteps.map((step) => ({
          listing_id: listing.id,
          platform: step.platform,
          command: step.command,
          description: step.description,
          sort_order: step.sortOrder,
        }))
      )

      if (samples.length < 5) samples.push(parsed)
      imported++
    } catch (err) {
      errors.push(`${skill.slug}: ${err instanceof Error ? err.message : "unknown error"}`)
    }
  }

  return {
    imported,
    skipped,
    errors,
    hasMore: Boolean(page.nextCursor),
    nextCursor: page.nextCursor ?? null,
    samples,
  }
}
