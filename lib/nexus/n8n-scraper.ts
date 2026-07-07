import { convertN8nToNexus, validateN8nWorkflow, findUnknownN8nNodeTypes, getUnknownN8nNodeSamples, type N8nWorkflow } from './n8n-converter'
import { importN8nWorkflow, type ImportPipelineResult } from './import'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateWorkflowTitle, generateFallbackTitle, generateWorkflowDescription, generateFallbackDescription, generateNodeDefinition } from '@/lib/ai/gemini'
import { saveCustomNode } from './custom-nodes'

const GITHUB_REPO = 'zie619/n8n-workflows'
const GITHUB_API_BASE = 'https://api.github.com/repos'

// Delay between GitHub API requests to avoid secondary rate limits (ms)
const REQUEST_DELAY_MS = 350
const MAX_RETRIES = 5
const BASE_RETRY_DELAY_MS = 1000
const REQUEST_TIMEOUT_MS = 30_000

// Cache generated node definitions so we only generate one definition per unknown n8n type
const generatedNodeCache = new Map<string, boolean>()

interface ScrapeResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{ file: string; error: string }>
  warnings: string[]
}

interface GitHubContent {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  }

  const githubToken = process.env.GITHUB_TOKEN
  if (githubToken) {
    // Prefer modern Bearer format; fall back to token format if needed
    headers['Authorization'] = `Bearer ${githubToken}`
  }

  return headers
}

function getRateLimitReset(response: Response): number | null {
  const resetHeader = response.headers.get('x-ratelimit-reset')
  if (!resetHeader) return null
  const resetTime = parseInt(resetHeader, 10) * 1000
  const waitMs = resetTime - Date.now()
  return waitMs > 0 ? waitMs : null
}

async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  parser: (response: Response) => Promise<T> = (response) => response.json() as Promise<T>
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let controller: AbortController | undefined
    try {
      await sleep(REQUEST_DELAY_MS)

      controller = new AbortController()
      const timeoutId = setTimeout(() => controller?.abort(), REQUEST_TIMEOUT_MS)

      const response = await fetch(url, {
        ...options,
        headers: { ...githubHeaders(), ...options?.headers },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return await parser(response)
      }

      const status = response.status
      const statusText = response.statusText

      // 403 can be rate limit or abuse; 429 is explicit rate limit
      if (status === 403 || status === 429) {
        const resetWait = getRateLimitReset(response)
        const retryAfter = response.headers.get('retry-after')
        const remaining = response.headers.get('x-ratelimit-remaining')
        const isAuthenticated = !!process.env.GITHUB_TOKEN

        let waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : resetWait
            ? resetWait + 1000
            : BASE_RETRY_DELAY_MS * 2 ** attempt

        // Cap wait at 60s to avoid hanging for the full hour when unauthenticated
        if (waitMs > 60_000) {
          if (!isAuthenticated) {
            throw new Error(
              'GitHub API rate limit exceeded and no GITHUB_TOKEN is set. ' +
              'Set a GITHUB_TOKEN environment variable with a personal access token to continue scraping.'
            )
          }
          waitMs = 60_000
        }

        console.warn(`GitHub rate limit hit (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Remaining: ${remaining ?? 'unknown'}. Waiting ${Math.round(waitMs / 1000)}s...`)
        await sleep(waitMs)
        continue
      }

      throw new Error(`GitHub API error: ${status} ${statusText}`)
    } catch (error) {
      if (controller) {
        try {
          controller.abort()
        } catch {
          // ignore
        }
      }

      const errorMessage = error instanceof Error ? error.message : String(error)
      lastError = new Error(
        errorMessage?.includes('abort') || errorMessage?.includes('AbortError')
          ? `GitHub request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`
          : errorMessage
      )

      if (attempt < MAX_RETRIES) {
        const waitMs = BASE_RETRY_DELAY_MS * 2 ** attempt
        console.warn(`GitHub request failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError.message}. Retrying in ${Math.round(waitMs / 1000)}s...`)
        await sleep(waitMs)
      }
    }
  }

  throw lastError || new Error('GitHub request failed after retries')
}

/**
 * Fetches directory contents from GitHub API
 */
async function fetchGitHubContents(path: string): Promise<GitHubContent[]> {
  const url = `${GITHUB_API_BASE}/${GITHUB_REPO}/contents/${path}`
  return fetchWithRetry<GitHubContent[]>(url)
}

interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  url: string
}

async function fetchGitHubTree(): Promise<GitHubTreeItem[]> {
  const url = `${GITHUB_API_BASE}/${GITHUB_REPO}/git/trees/main?recursive=1`
  const data = await fetchWithRetry<{ tree: GitHubTreeItem[] }>(url)
  return data.tree || []
}

function rawGitHubUrl(path: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${path}`
}

interface WorkflowFile {
  category: string
  path: string
  name: string
}

let treeCache: GitHubTreeItem[] | null = null
let treeCachePromise: Promise<GitHubTreeItem[]> | null = null

async function getN8nWorkflowFiles(): Promise<WorkflowFile[]> {
  if (!treeCachePromise) {
    treeCachePromise = fetchGitHubTree().then((tree) => {
      treeCache = tree
      return tree
    })
  }
  const tree = await treeCachePromise
  return tree
    .filter((item) => item.type === 'blob' && item.path.startsWith('workflows/') && item.path.endsWith('.json'))
    .map((item) => {
      const parts = item.path.split('/')
      const category = parts[1] || 'General'
      const name = parts[parts.length - 1]
      return { category, path: item.path, name }
    })
}

function resetWorkflowFileCache() {
  treeCache = null
  treeCachePromise = null
}

/**
 * Fetches a single workflow file from raw.githubusercontent.com.
 * Raw downloads do not count against the GitHub API rate limit.
 */
async function fetchGitHubFile(path: string): Promise<N8nWorkflow> {
  return fetchWithRetry<N8nWorkflow>(rawGitHubUrl(path))
}

/**
 * Detects n8n node types that are not in the Nexus registry and generates/saves
 * placeholder definitions for them. Uses an in-memory cache so each type is only
 * generated once per process.
 */
export async function ensureUnknownNodes(
  n8nWorkflow: N8nWorkflow,
  onProgress?: (message: string) => void
): Promise<string[]> {
  const unknownTypes = findUnknownN8nNodeTypes(n8nWorkflow)
  if (unknownTypes.length === 0) return []

  const samples = getUnknownN8nNodeSamples(n8nWorkflow)
  const generated: string[] = []

  for (const type of unknownTypes) {
    if (generatedNodeCache.has(type)) continue
    generatedNodeCache.set(type, true)

    onProgress?.(`Generating node definition for: ${type}`)
    const result = await generateNodeDefinition(type, samples[type] || {})
    if (result.success && result.content) {
      try {
        await saveCustomNode(result.content, type)
        generated.push(type)
      } catch (saveError) {
        console.warn(`Failed to save custom node ${type}:`, saveError)
      }
    }
  }

  return generated
}

/**
 * Scrapes all n8n workflows from the GitHub repository
 * and converts them to Nexus format
 */
export async function scrapeN8nWorkflows(
  onProgress?: (current: number, total: number, message: string) => void
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    warnings: [],
  }

  try {
    // Fetch all workflow categories
    onProgress?.(0, 0, 'Fetching workflow categories...')
    const categories = await fetchGitHubContents('workflows')
    const workflowCategories = categories.filter((c) => c.type === 'dir')

    let totalFiles = 0
    let processedFiles = 0

    // First pass: count total files
    for (const category of workflowCategories) {
      const files = await fetchGitHubContents(category.path)
      totalFiles += files.filter((f) => f.type === 'file' && f.name.endsWith('.json')).length
    }

    onProgress?.(0, totalFiles, `Found ${totalFiles} workflows across ${workflowCategories.length} categories`)

    // Second pass: process each workflow
    for (const category of workflowCategories) {
      onProgress?.(processedFiles, totalFiles, `Processing category: ${category.name}`)
      
      try {
        const files = await fetchGitHubContents(category.path)
        const workflowFiles = files.filter((f) => f.type === 'file' && f.name.endsWith('.json'))

        for (const file of workflowFiles) {
          processedFiles++
          onProgress?.(processedFiles, totalFiles, `Processing: ${file.name}`)

          try {
            if (!file.download_url) {
              result.errors.push({ file: file.name, error: 'No download URL' })
              result.failed++
              continue
            }

            // Fetch and parse the n8n workflow
            const n8nWorkflow = await fetchGitHubFile(file.download_url)

            // Validate the workflow
            const validation = validateN8nWorkflow(n8nWorkflow)
            if (!validation.valid) {
              result.errors.push({
                file: file.name,
                error: `Validation failed: ${validation.errors.join(', ')}`,
              })
              result.failed++
              continue
            }

            // Add warnings from validation
            if (validation.warnings.length > 0) {
              result.warnings.push(`${file.name}: ${validation.warnings.join(', ')}`)
            }

            // Generate Nexus definitions for any unknown n8n node types
            await ensureUnknownNodes(n8nWorkflow, (message) => {
              onProgress?.(processedFiles, totalFiles, message)
            })

            // Convert to Nexus format
            const nexusDefinition = convertN8nToNexus(n8nWorkflow)

            // Return the converted workflow for storage
            // The caller will handle database insertion
            result.imported++
          } catch (error) {
            result.errors.push({
              file: file.name,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
            result.failed++
          }
        }
      } catch (error) {
        result.errors.push({
          file: category.name,
          error: error instanceof Error ? error.message : 'Failed to fetch category',
        })
      }
    }

    if (result.failed > 0) {
      result.success = false
    }
  } catch (error) {
    result.success = false
    result.errors.push({
      file: 'global',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  return result
}

/**
 * Scrapes a single workflow category and saves to database
 */
export async function scrapeN8nCategory(
  categoryName: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ workflows: Array<{ name: string; definition: any; n8nWorkflow: N8nWorkflow }>; errors: string[] }> {
  const workflows: Array<{ name: string; definition: any; n8nWorkflow: N8nWorkflow }> = []
  const errors: string[] = []
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  try {
    onProgress?.(0, 0, `Fetching category: ${categoryName}`)
    const allFiles = await getN8nWorkflowFiles()
    const workflowFiles = allFiles.filter((f) => f.category === categoryName)

    onProgress?.(0, workflowFiles.length, `Found ${workflowFiles.length} workflows`)

    // Pre-fetch existing templates to avoid re-generating AI titles on re-runs
    const { data: existingTemplates } = await supabase
      .from('nexus_workflow_templates')
      .select('name, seo_title')
      .eq('source', 'n8n')
    const existingTitleMap = new Map(existingTemplates?.map(t => [t.name, t.seo_title]) || [])

    for (let i = 0; i < workflowFiles.length; i++) {
      const file = workflowFiles[i]
      onProgress?.(i + 1, workflowFiles.length, `Processing: ${file.name}`)

      try {
        const n8nWorkflow = await fetchGitHubFile(file.path)
        const validation = validateN8nWorkflow(n8nWorkflow)

        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.errors.join(', ')}`)
          continue
        }

        // Generate Nexus definitions for any n8n node types we don't have yet
        await ensureUnknownNodes(n8nWorkflow, (message) => {
          onProgress?.(i + 1, workflowFiles.length, message)
        })

        // Use new compatibility engine pipeline for conversion
        const importResult = await importN8nWorkflow(n8nWorkflow, {
          autoLayout: true,
          preservePositions: false,
          strictMode: false,
          debug: false
        })

        if (!importResult.success || !importResult.definition) {
          errors.push(`${file.name}: Import failed - ${importResult.error || 'Unknown error'}`)
          if (importResult.report) {
            // Add report details to error for debugging
            const reportErrors = importResult.report.errors.map(e => `[${e.stage}] ${e.message}`).join('; ')
            if (reportErrors) errors.push(`${file.name}: ${reportErrors}`)
          }
          continue
        }

        const nexusDefinition = importResult.definition
        const workflowName = file.name.replace('.json', '')
        const n8nWorkflowName = n8nWorkflow.name || workflowName

        // Log import report statistics for monitoring
        if (importResult.report) {
          const stats = importResult.report
          console.log(`Import stats for ${workflowName}: ${stats.mappedNodes} mapped, ${stats.customNodes} custom, ${stats.unsupportedNodes} unsupported, ${stats.reconstructedConnections}/${stats.totalConnections} connections`)
          if (stats.errors.length > 0) {
            console.warn(`Import errors for ${workflowName}:`, stats.errors.map(e => e.message))
          }
        }

        // Use existing AI-generated title if available, otherwise generate one
        const existingTitle = existingTitleMap.get(workflowName)
        let seoTitle = existingTitle || generateFallbackTitle(n8nWorkflowName)
        let titleWasGenerated = !!existingTitle

        // Regenerate if the stored title is still a raw filename (contains underscores / leading numbers)
        const needsTitleRegeneration = !existingTitle || /^\d+[_-]/.test(existingTitle) || existingTitle.includes('_')

        if (needsTitleRegeneration) {
          onProgress?.(i + 1, workflowFiles.length, `Generating title for: ${file.name}`)
          const titleResult = await generateWorkflowTitle(n8nWorkflowName, n8nWorkflow)
          if (titleResult.success && titleResult.content) {
            seoTitle = titleResult.content
            titleWasGenerated = true
          }
        }

        // Generate a description based on the title and workflow content
        let description = n8nWorkflow.description || generateFallbackDescription(seoTitle)
        const hasRealDescription = n8nWorkflow.description && n8nWorkflow.description.length > 10 && !n8nWorkflow.description.startsWith('Imported')
        if (!hasRealDescription) {
          onProgress?.(i + 1, workflowFiles.length, `Generating description for: ${file.name}`)
          const descriptionResult = await generateWorkflowDescription(seoTitle, n8nWorkflow)
          if (descriptionResult.success && descriptionResult.content) {
            description = descriptionResult.content
          }
        }

        // Derive brand-aware metadata (tags, difficulty, icon, color, logo) from workflow name and nodes
        const metadata = deriveWorkflowMetadata(n8nWorkflow, categoryName, file.name)

        // Upload the raw n8n JSON to Supabase Storage
        onProgress?.(i + 1, workflowFiles.length, `Uploading JSON for: ${file.name}`)
        const storagePath = `${categoryName}/${workflowName}.json`

        try {
          const { error: uploadError } = await serviceClient
            .storage
            .from('n8n-workflows')
            .upload(storagePath, JSON.stringify(n8nWorkflow), {
              contentType: 'application/json',
              upsert: true,
            })

          if (uploadError) {
            errors.push(`${file.name}: Storage upload failed - ${uploadError.message}`)
          }
        } catch (uploadError) {
          errors.push(`${file.name}: Storage upload failed - ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
        }
        
        // Save to database as template using the service role so RLS cannot block admin scraping
        // Save the FULL converted definition instead of placeholder
        onProgress?.(i + 1, workflowFiles.length, `Saving to database: ${file.name}`)
        const { error: insertError } = await serviceClient
          .from('nexus_workflow_templates')
          .upsert({
            name: workflowName,
            seo_title: seoTitle,
            description,
            category: mapN8nCategoryToNexus(categoryName),
            icon: metadata.icon,
            color: metadata.color,
            logo_url: metadata.logoUrl,
            tags: metadata.tags,
            difficulty: metadata.difficulty,
            definition: nexusDefinition, // Full converted definition with all nodes
            source: 'n8n',
            source_url: rawGitHubUrl(file.path),
            storage_path: storagePath,
            source_metadata: {
              original_name: n8nWorkflowName,
              generated_seo_title: titleWasGenerated,
              n8n_version: n8nWorkflow.version || '1.0',
              node_count: n8nWorkflow.nodes?.length || 0,
              node_types: n8nWorkflow.nodes?.map(n => n.type) || []
            }
          }, {
            onConflict: 'name'
          })

        if (insertError) {
          const message = `${file.name}: Failed to save to database - ${insertError.message}`
          console.error(message, insertError)
          errors.push(message)
          continue
        }

        workflows.push({
          name: workflowName,
          definition: nexusDefinition,
          n8nWorkflow,
        })
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  } catch (error) {
    errors.push(`Category fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return { workflows, errors }
}

/**
 * Scrapes all n8n workflow categories and saves them to the template database.
 */
export async function scrapeAllN8nTemplates(
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{
  imported: number
  failed: number
  categories: number
  errors: string[]
}> {
  const result = { imported: 0, failed: 0, categories: 0, errors: [] as string[] }

  try {
    onProgress?.(0, 0, 'Fetching workflow categories...')
    const allFiles = await getN8nWorkflowFiles()
    const categoryNames = Array.from(new Set(allFiles.map((f) => f.category)))
    result.categories = categoryNames.length

    let totalFiles = allFiles.length
    let processedFiles = 0

    onProgress?.(0, totalFiles, `Found ${totalFiles} workflows across ${categoryNames.length} categories`)

    for (const categoryName of categoryNames) {
      onProgress?.(processedFiles, totalFiles, `Processing category: ${categoryName}`)

      const { workflows, errors } = await scrapeN8nCategory(categoryName, (current, total, message) => {
        if (current > 0) processedFiles++
        onProgress?.(processedFiles, totalFiles, message)
      })

      result.imported += workflows.length
      result.errors.push(...errors)
      result.failed += errors.length
    }

    onProgress?.(processedFiles, totalFiles, `Scrape complete: ${result.imported} workflows imported`)
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return result
}

/**
 * Maps n8n category names to Nexus categories
 */
function mapN8nCategoryToNexus(n8nCategory: string): string {
  const categoryMap: Record<string, string> = {
    'ai': 'AI',
    'communication': 'Communication',
    'crm': 'CRM',
    'data': 'Data',
    'database': 'Database',
    'developer': 'Developer',
    'files': 'Files',
    'finance': 'Finance',
    'marketing': 'Marketing',
    'productivity': 'Productivity',
    'sales': 'Sales',
    'security': 'Security',
    'social': 'Social',
    'utilities': 'Utilities',
  }
  
  return categoryMap[n8nCategory.toLowerCase()] || 'General'
}

interface BrandConfig {
  name: string
  color: string
  icon: string
  logoSlug: string
  tags: string[]
}

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  'whatsapp': { name: 'WhatsApp', color: '#25D366', icon: 'W', logoSlug: 'whatsapp', tags: ['whatsapp', 'business'] },
  'telegram': { name: 'Telegram', color: '#26A5E4', icon: 'T', logoSlug: 'telegram', tags: ['telegram', 'business'] },
  'slack': { name: 'Slack', color: '#4A154B', icon: 'S', logoSlug: 'slack', tags: ['slack', 'business'] },
  'discord': { name: 'Discord', color: '#5865F2', icon: 'D', logoSlug: 'discord', tags: ['discord', 'business'] },
  'gmail': { name: 'Gmail', color: '#EA4335', icon: 'G', logoSlug: 'gmail', tags: ['gmail', 'email'] },
  'google': { name: 'Google', color: '#4285F4', icon: 'G', logoSlug: 'google', tags: ['google', 'workspace'] },
  'googlesheets': { name: 'Google Sheets', color: '#34A853', icon: 'G', logoSlug: 'googlesheets', tags: ['google', 'sheets'] },
  'googledocs': { name: 'Google Docs', color: '#4285F4', icon: 'G', logoSlug: 'googledocs', tags: ['google', 'docs'] },
  'googlecalendar': { name: 'Google Calendar', color: '#4285F4', icon: 'G', logoSlug: 'googlecalendar', tags: ['google', 'calendar'] },
  'googledrive': { name: 'Google Drive', color: '#4285F4', icon: 'G', logoSlug: 'googledrive', tags: ['google', 'drive'] },
  'openai': { name: 'OpenAI', color: '#10A37F', icon: 'AI', logoSlug: 'openai', tags: ['openai', 'ai'] },
  'anthropic': { name: 'Anthropic', color: '#D97757', icon: 'A', logoSlug: 'anthropic', tags: ['anthropic', 'ai'] },
  'stripe': { name: 'Stripe', color: '#635BFF', icon: 'S', logoSlug: 'stripe', tags: ['stripe', 'finance'] },
  'shopify': { name: 'Shopify', color: '#96BF48', icon: 'S', logoSlug: 'shopify', tags: ['shopify', 'ecommerce'] },
  'airtable': { name: 'Airtable', color: '#18BFFF', icon: 'A', logoSlug: 'airtable', tags: ['airtable', 'database'] },
  'notion': { name: 'Notion', color: '#000000', icon: 'N', logoSlug: 'notion', tags: ['notion', 'database'] },
  'asana': { name: 'Asana', color: '#F06A6A', icon: 'A', logoSlug: 'asana', tags: ['asana', 'productivity'] },
  'trello': { name: 'Trello', color: '#0052CC', icon: 'T', logoSlug: 'trello', tags: ['trello', 'productivity'] },
  'jira': { name: 'Jira', color: '#0052CC', icon: 'J', logoSlug: 'jira', tags: ['jira', 'productivity'] },
  'github': { name: 'GitHub', color: '#181717', icon: 'G', logoSlug: 'github', tags: ['github', 'developer'] },
  'gitlab': { name: 'GitLab', color: '#FC6D26', icon: 'G', logoSlug: 'gitlab', tags: ['gitlab', 'developer'] },
  'hubspot': { name: 'HubSpot', color: '#FF7A59', icon: 'H', logoSlug: 'hubspot', tags: ['hubspot', 'crm'] },
  'salesforce': { name: 'Salesforce', color: '#00A1E0', icon: 'S', logoSlug: 'salesforce', tags: ['salesforce', 'crm'] },
  'twilio': { name: 'Twilio', color: '#F22F46', icon: 'T', logoSlug: 'twilio', tags: ['twilio', 'sms'] },
  'vonage': { name: 'Vonage', color: '#00A3E0', icon: 'V', logoSlug: 'vonage', tags: ['vonage', 'sms'] },
  'mysql': { name: 'MySQL', color: '#4479A1', icon: 'M', logoSlug: 'mysql', tags: ['mysql', 'database'] },
  'postgres': { name: 'PostgreSQL', color: '#4169E1', icon: 'P', logoSlug: 'postgresql', tags: ['postgresql', 'database'] },
  'supabase': { name: 'Supabase', color: '#3ECF8E', icon: 'S', logoSlug: 'supabase', tags: ['supabase', 'database'] },
  'mongodb': { name: 'MongoDB', color: '#47A248', icon: 'M', logoSlug: 'mongodb', tags: ['mongodb', 'database'] },
  'aws': { name: 'AWS', color: '#FF9900', icon: 'A', logoSlug: 'amazonaws', tags: ['aws', 'cloud'] },
  's3': { name: 'AWS S3', color: '#FF9900', icon: 'S', logoSlug: 'amazons3', tags: ['aws', 's3'] },
  'twitter': { name: 'Twitter/X', color: '#000000', icon: 'X', logoSlug: 'x', tags: ['twitter', 'social'] },
  'linkedin': { name: 'LinkedIn', color: '#0A66C2', icon: 'L', logoSlug: 'linkedin', tags: ['linkedin', 'social'] },
  'facebook': { name: 'Facebook', color: '#0866FF', icon: 'F', logoSlug: 'facebook', tags: ['facebook', 'social'] },
  'instagram': { name: 'Instagram', color: '#E4405F', icon: 'I', logoSlug: 'instagram', tags: ['instagram', 'social'] },
  'tiktok': { name: 'TikTok', color: '#000000', icon: 'T', logoSlug: 'tiktok', tags: ['tiktok', 'social'] },
  'youtube': { name: 'YouTube', color: '#FF0000', icon: 'Y', logoSlug: 'youtube', tags: ['youtube', 'social'] },
  'webhook': { name: 'Webhook', color: '#6366f1', icon: 'W', logoSlug: 'webhook', tags: ['webhook', 'integration'] },
  'schedule': { name: 'Schedule', color: '#f59e0b', icon: 'S', logoSlug: 'clockify', tags: ['schedule', 'automation'] },
  'code': { name: 'Code', color: '#8b5cf6', icon: 'C', logoSlug: 'javascript', tags: ['code', 'developer'] },
  'httprequest': { name: 'HTTP', color: '#3b82f6', icon: 'H', logoSlug: 'http', tags: ['http', 'api'] },
  'filter': { name: 'Filter', color: '#10b981', icon: 'F', logoSlug: 'filter', tags: ['filter', 'logic'] },
  'if': { name: 'Condition', color: '#10b981', icon: 'I', logoSlug: 'ifttt', tags: ['condition', 'logic'] },
  'switch': { name: 'Switch', color: '#10b981', icon: 'S', logoSlug: 'switch', tags: ['switch', 'logic'] },
  'set': { name: 'Set', color: '#8b5cf6', icon: 'S', logoSlug: 'json', tags: ['data', 'transform'] },
  'function': { name: 'Function', color: '#8b5cf6', icon: 'F', logoSlug: 'javascript', tags: ['code', 'developer'] },
  'summit': { name: 'Summit', color: '#f97316', icon: 'S', logoSlug: 'summit', tags: ['summit', 'business'] },
}

const AI_SERVICE_TAGS = ['ai', 'llm', 'openai', 'anthropic', 'gemini', 'claude', 'gpt']
const ADVANCED_NODE_TYPES = ['code', 'function', 'httprequest', 'executecommand', 'executeworkflow', 'wait', 'sseTrigger', 'respondtowebhook']
const ACTION_KEYWORDS = ['send', 'create', 'update', 'delete', 'automate', 'aggregate', 'trigger', 'schedule', 'notify', 'alert', 'sync', 'export', 'import', 'fetch', 'post', 'analyze']

function extractServiceName(nodeType: string): string {
  if (!nodeType) return ''
  if (nodeType.startsWith('n8n-nodes-base.')) {
    return nodeType.replace('n8n-nodes-base.', '').replace(/Trigger$/, '').replace(/[^a-zA-Z]/g, '').toLowerCase()
  }
  return nodeType.replace(/[^a-zA-Z]/g, '').toLowerCase()
}

function extractServiceNamesFromFilename(filename: string): string[] {
  const clean = filename.replace(/^\d+[_-]/, '').replace(/\.json$/, '').toLowerCase()
  const parts = clean.split(/[_-]/).filter(Boolean)
  const names: string[] = []
  for (const part of parts) {
    const alpha = part.replace(/[^a-z]/g, '')
    if (alpha.length < 2) continue
    if (ACTION_KEYWORDS.includes(alpha)) continue
    names.push(alpha)
    // Add common brand names that appear in the filename
    const brand = getBrandForService(alpha)
    if (brand) {
      names.push(brand.name.toLowerCase().replace(/[^a-z]/g, ''))
    }
  }
  return names
}

function getBrandForService(serviceName: string): BrandConfig | undefined {
  if (!serviceName) return undefined
  const normalized = serviceName.toLowerCase().replace(/[^a-z]/g, '')
  // Direct match
  if (BRAND_CONFIGS[normalized]) return BRAND_CONFIGS[normalized]
  // Fuzzy match by substring
  for (const [key, config] of Object.entries(BRAND_CONFIGS)) {
    if (normalized.includes(key) || key.includes(normalized)) return config
  }
  return undefined
}

function deriveWorkflowMetadata(
  n8nWorkflow: N8nWorkflow,
  categoryName: string,
  filename: string
): {
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  icon: string
  color: string
  logoUrl: string | null
  brandName: string | null
} {
  const nodes = n8nWorkflow.nodes || []
  const nodeTypes = nodes.map(n => n.type)
  const serviceNamesFromNodes = nodeTypes.map(extractServiceName).filter(Boolean)
  const serviceNamesFromFilename = extractServiceNamesFromFilename(filename)
  const allServiceNames = [...new Set([...serviceNamesFromFilename, ...serviceNamesFromNodes])]

  const tagSet = new Set<string>([categoryName.toLowerCase()])
  const brandScores = new Map<string, { config: BrandConfig; score: number }>()

  // Score brands by frequency and source
  for (const serviceName of allServiceNames) {
    const brand = getBrandForService(serviceName)
    if (brand) {
      brand.tags.forEach(tag => tagSet.add(tag))
      const existing = brandScores.get(brand.name)
      const isFromFilename = serviceNamesFromFilename.includes(serviceName)
      const score = (existing?.score || 0) + (isFromFilename ? 3 : 1)
      brandScores.set(brand.name, { config: brand, score })
    } else {
      // Add raw service names as tags if they look meaningful
      if (serviceName.length > 2 && !serviceName.includes('n8n')) {
        tagSet.add(serviceName)
      }
    }
  }

  // Add action keywords from filename
  const cleanFilename = filename.replace(/^\d+[_-]/, '').replace(/\.json$/, '').toLowerCase()
  for (const keyword of ACTION_KEYWORDS) {
    if (cleanFilename.includes(keyword)) tagSet.add(keyword)
  }

  // Add AI tag if AI nodes present
  if (nodeTypes.some(t => AI_SERVICE_TAGS.some(ai => t.toLowerCase().includes(ai)))) {
    tagSet.add('ai')
  }

  // Add trigger type tags
  const triggerTypes = nodeTypes.filter(t => t && t.toLowerCase().includes('trigger'))
  if (triggerTypes.length > 0) {
    tagSet.add('trigger')
    if (triggerTypes.some(t => t.toLowerCase().includes('webhook'))) tagSet.add('webhook')
    if (triggerTypes.some(t => t.toLowerCase().includes('schedule') || t.toLowerCase().includes('cron'))) tagSet.add('scheduled')
  }
  if (nodeTypes.some(t => t && t.toLowerCase().includes('respondtowebhook'))) tagSet.add('webhook')

  // Add business tag for relevant categories
  if (['communication', 'crm', 'sales', 'marketing', 'finance', 'productivity'].includes(categoryName.toLowerCase())) {
    tagSet.add('business')
  }

  // Determine primary brand by score
  let primaryBrand: BrandConfig | null = null
  let bestScore = 0
  for (const { config, score } of brandScores.values()) {
    if (score > bestScore) {
      bestScore = score
      primaryBrand = config
    }
  }

  // Calculate difficulty
  const nodeCount = nodes.length
  const hasAdvancedNodes = nodeTypes.some(t =>
    ADVANCED_NODE_TYPES.some(advanced => t.toLowerCase().includes(advanced))
  )
  const connectionCount = Object.keys(n8nWorkflow.connections || {}).length
  const hasBranches = nodeTypes.some(t => {
    const lower = t?.toLowerCase() || ''
    return lower === 'n8n-nodes-base.if' || lower === 'n8n-nodes-base.switch' || lower.endsWith('.if') || lower.endsWith('.switch')
  })
  const hasLooping = nodeTypes.some(t => {
    const lower = t?.toLowerCase() || ''
    return lower.includes('loop') || lower.includes('splitinbatches') || lower.includes('wait')
  })
  const hasCode = nodeTypes.some(t => {
    const lower = t?.toLowerCase() || ''
    return lower.includes('code') || lower.includes('function') || lower.includes('executeworkflow')
  })

  let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
  if (nodeCount >= 12 || (nodeCount >= 8 && hasBranches) || hasCode || hasLooping || hasAdvancedNodes || connectionCount > 12) {
    difficulty = 'advanced'
  } else if (nodeCount >= 5 || hasBranches || connectionCount > 6) {
    difficulty = 'intermediate'
  }

  // Prioritize and limit tags
  const priorityTags: string[] = []
  if (primaryBrand) {
    priorityTags.push(primaryBrand.logoSlug)
    priorityTags.push(...primaryBrand.tags.filter(t => !priorityTags.includes(t)))
  }
  const remainingTags = Array.from(tagSet).filter(t => !priorityTags.includes(t))
  const tags = [...priorityTags, ...remainingTags].slice(0, 8)

  const icon = primaryBrand?.icon || '⚡'
  const color = primaryBrand?.color || '#6366f1'
  const logoUrl = primaryBrand ? `/logos/${primaryBrand.logoSlug}.svg` : null

  return {
    tags,
    difficulty,
    icon,
    color,
    logoUrl,
    brandName: primaryBrand?.name || null,
  }
}
