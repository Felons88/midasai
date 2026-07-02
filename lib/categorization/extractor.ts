export interface ExtractedContent {
  title: string
  description: string
  shortDescription: string | null
  readme: string | null
  tags: string[]
  topics: string[]
  fileNames: string[]
  filePaths: string[]
  dependencies: string[]
  scripts: string[]
  fileSnippets: string[]
  detectedLanguages: string[]
  folderStructure: string
  installCommands: string[]
  aiAssistantHints: string[]
}

interface ListingFile {
  name?: string | null
  path?: string | null
  content?: string | null
  url?: string | null
}

interface ListingFilesData {
  tree?: string[] | null
  files?: ListingFile[] | null
  readme?: string | null
  packageJson?: string | null
  [key: string]: unknown
}

const MAX_README_LENGTH = 6000
const MAX_SNIPPETS = 20
const MAX_SNIPPET_LENGTH = 500
const MAX_FILES = 200

export function extractListingContent(
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
): ExtractedContent {
  const title = listing.title ?? ""
  const description = listing.description ?? ""
  const shortDescription = listing.short_description ?? null
  const readme = listing.readme ?? null
  const tags = listing.tags ?? []
  const topics = listing.topics ?? []
  const type = listing.type ?? ""

  const filesData = normalizeFiles(listing.files)
  const fileNames: string[] = []
  const filePaths: string[] = []
  const fileSnippets: string[] = []
  const detectedLanguages: string[] = []
  const dependencies: string[] = []
  const scripts: string[] = []
  const installCommands: string[] = []
  const aiAssistantHints: string[] = []

  const tree = filesData.tree ?? []
  const files = filesData.files ?? []

  // Tree-only listings
  if (tree.length > 0 && files.length === 0) {
    for (const path of tree.slice(0, MAX_FILES)) {
      if (typeof path !== "string") continue
      filePaths.push(path)
      const name = path.split("/").pop() ?? ""
      if (name && !fileNames.includes(name)) fileNames.push(name)
      const ext = getExtension(name)
      if (ext) detectedLanguages.push(ext)
    }
  }

  // File content listings
  for (const file of files.slice(0, MAX_FILES)) {
    if (!file) continue
    const path = file.path ?? file.name ?? ""
    const name = path.split("/").pop() ?? path
    const content = file.content ?? ""

    if (path) filePaths.push(path)
    if (name && !fileNames.includes(name)) fileNames.push(name)

    const ext = getExtension(name)
    if (ext && !detectedLanguages.includes(ext)) detectedLanguages.push(ext)

    if (content) {
      const snippet = content.slice(0, MAX_SNIPPET_LENGTH).trim()
      if (snippet && fileSnippets.length < MAX_SNIPPETS) {
        fileSnippets.push(`${path}:\n${snippet}`)
      }

      if (isPackageJson(name)) {
        const parsed = safeJsonParse(content)
        if (parsed) {
          dependencies.push(...extractDependencies(parsed))
          scripts.push(...extractScripts(parsed))
        }
      }

      if (isRequirementsTxt(name)) {
        dependencies.push(...extractRequirements(content))
      }

      if (isCargoToml(name)) {
        dependencies.push(...extractCargoDependencies(content))
      }

      if (isGemfile(name)) {
        dependencies.push(...extractGemfileDependencies(content))
      }

      if (isPyprojectToml(name)) {
        dependencies.push(...extractPyprojectDependencies(content))
      }

      if (isReadme(name)) {
        // already captured separately
      }

      if (isAiAssistantFile(name)) {
        aiAssistantHints.push(`${name}: ${content.slice(0, 800)}`)
      }
    }
  }

  // Readme-based install commands
  if (readme) {
    installCommands.push(...extractInstallCommands(readme))
  }

  return {
    title,
    description,
    shortDescription,
    readme: readme ? readme.slice(0, MAX_README_LENGTH) : null,
    tags,
    topics,
    fileNames,
    filePaths,
    dependencies: [...new Set(dependencies)].slice(0, 50),
    scripts: [...new Set(scripts)].slice(0, 30),
    fileSnippets,
    detectedLanguages: [...new Set(detectedLanguages)].slice(0, 20),
    folderStructure: buildFolderStructure(filePaths),
    installCommands: [...new Set(installCommands)].slice(0, 20),
    aiAssistantHints: [...new Set(aiAssistantHints)].slice(0, 10),
  }
}

function normalizeFiles(files: unknown): ListingFilesData {
  if (!files) return { tree: [], files: [] }
  if (typeof files === "string") {
    try {
      return JSON.parse(files) as ListingFilesData
    } catch {
      return { tree: [], files: [] }
    }
  }
  if (Array.isArray(files)) {
    return { tree: [], files: files as ListingFile[] }
  }
  if (typeof files === "object") {
    return files as ListingFilesData
  }
  return { tree: [], files: [] }
}

function getExtension(name: string): string | null {
  const match = name.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : null
}

function isPackageJson(name: string): boolean {
  return name.toLowerCase().endsWith("package.json")
}

function isRequirementsTxt(name: string): boolean {
  return name.toLowerCase().endsWith("requirements.txt")
}

function isCargoToml(name: string): boolean {
  return name.toLowerCase().endsWith("cargo.toml")
}

function isGemfile(name: string): boolean {
  return name.toLowerCase() === "gemfile"
}

function isPyprojectToml(name: string): boolean {
  return name.toLowerCase().endsWith("pyproject.toml")
}

function isReadme(name: string): boolean {
  return name.toLowerCase().startsWith("readme")
}

function isAiAssistantFile(name: string): boolean {
  const lower = name.toLowerCase()
  return (
    lower.includes(".cursorrules") ||
    lower.includes("claude.md") ||
    lower.includes("claude_instructions") ||
    lower.includes("cursor_rules") ||
    lower.includes("windsurf") ||
    lower.includes("ai-instructions") ||
    lower.includes("prompts/") ||
    lower.includes("system.md")
  )
}

function safeJsonParse(content: string): Record<string, unknown> | null {
  try {
    return JSON.parse(content) as Record<string, unknown>
  } catch {
    return null
  }
}

function extractDependencies(parsed: Record<string, unknown>): string[] {
  const deps: string[] = []
  const add = (obj: unknown) => {
    if (obj && typeof obj === "object") {
      deps.push(...Object.keys(obj))
    }
  }
  add(parsed.dependencies)
  add(parsed.devDependencies)
  add(parsed.peerDependencies)
  return deps
}

function extractScripts(parsed: Record<string, unknown>): string[] {
  const scripts = parsed.scripts
  if (!scripts || typeof scripts !== "object") return []
  return Object.entries(scripts).map(([name, cmd]) => `${name}: ${String(cmd).slice(0, 100)}`)
}

function extractRequirements(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("==")[0].split(">=")[0].split("<")[0].trim())
    .filter(Boolean)
}

function extractCargoDependencies(content: string): string[] {
  const deps: string[] = []
  const lines = content.split("\n")
  let inDeps = false
  for (const line of lines) {
    if (line.trim().startsWith("[dependencies]")) {
      inDeps = true
      continue
    }
    if (line.trim().startsWith("[")) {
      inDeps = false
    }
    if (inDeps && line.includes("=")) {
      const name = line.split("=")[0].trim().replace(/^"|"$/g, "")
      if (name) deps.push(name)
    }
  }
  return deps
}

function extractGemfileDependencies(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("gem "))
    .map((line) => {
      const match = line.match(/gem\s+['"]([^'"]+)['"]/)
      return match ? match[1] : ""
    })
    .filter(Boolean)
}

function extractPyprojectDependencies(content: string): string[] {
  const deps: string[] = []
  const lines = content.split("\n")
  let inDeps = false
  for (const line of lines) {
    if (line.trim().startsWith("[project.dependencies]") || line.trim().startsWith("[tool.poetry.dependencies]")) {
      inDeps = true
      continue
    }
    if (line.trim().startsWith("[")) {
      inDeps = false
    }
    if (inDeps && line.includes("=")) {
      const name = line.split("=")[0].trim().replace(/^"|"$/g, "")
      if (name) deps.push(name)
    }
  }
  return deps
}

function extractInstallCommands(readme: string): string[] {
  const commands: string[] = []
  const lines = readme.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith("```") && line.toLowerCase().includes("bash")) {
      const block: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        block.push(lines[i])
        i++
      }
      const joined = block.join("\n").trim()
      if (joined) commands.push(joined)
    }
    if (line.startsWith("npm install") || line.startsWith("yarn ") || line.startsWith("pip install") || line.startsWith("cargo install")) {
      commands.push(line)
    }
  }
  return commands
}

function buildFolderStructure(paths: string[]): string {
  if (paths.length === 0) return ""
  const tree = new Set<string>()
  for (const path of paths.slice(0, 50)) {
    const parts = path.split("/")
    for (let i = 0; i < parts.length; i++) {
      tree.add("  ".repeat(i) + parts[i])
    }
  }
  return Array.from(tree).join("\n")
}
