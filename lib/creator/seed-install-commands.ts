import type { SupabaseClient } from "@supabase/supabase-js"
import type { InstallPlatform } from "@/components/creator/InstallCommandManager"

const PLATFORM_MAP: Record<string, InstallPlatform> = {
  cursor: "CURSOR",
  "claude code": "CLAUDE_CODE",
  "claude desktop": "CLAUDE_DESKTOP",
  windsurf: "WINDSURF",
  vscode: "VSCODE",
  "vs code": "VSCODE",
  "github copilot": "GITHUB_COPILOT",
  copilot: "GITHUB_COPILOT",
  cli: "CLI",
  npm: "NPM",
  manual: "MANUAL",
}

function mapPlatform(raw: string): InstallPlatform {
  const key = raw.toLowerCase().trim()
  return PLATFORM_MAP[key] ?? "OTHER"
}

interface SeedInput {
  listingId: string
  supportedPlatforms?: string[]
  installationSteps?: string[]
  githubUrl?: string | null
}

export async function seedInstallCommands(
  supabase: SupabaseClient,
  { listingId, supportedPlatforms, installationSteps, githubUrl }: SeedInput
) {
  const platforms = supportedPlatforms?.length
    ? supportedPlatforms
    : githubUrl
      ? ["npm"]
      : []

  if (platforms.length === 0) return

  const defaultCommand =
    installationSteps?.[0] ??
    (githubUrl ? `git clone ${githubUrl}` : "See listing README for install steps")

  const rows = platforms.map((platform, index) => ({
    listing_id: listingId,
    platform: mapPlatform(platform),
    command: installationSteps?.[index] ?? defaultCommand,
    sort_order: index,
  }))

  await supabase.from("listing_install_commands").upsert(rows, {
    onConflict: "listing_id,platform",
  })
}
