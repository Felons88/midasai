import { convertN8nToNexus, validateN8nWorkflow, type N8nWorkflow } from './n8n-converter'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateWorkflowTitle, generateFallbackTitle, generateWorkflowDescription, generateFallbackDescription } from '@/lib/ai/gemini'

const GITHUB_REPO = 'zie619/n8n-workflows'
const GITHUB_API_BASE = 'https://api.github.com/repos'

// Delay between GitHub API requests to avoid secondary rate limits (ms)
const REQUEST_DELAY_MS = 350
const MAX_RETRIES = 5
const BASE_RETRY_DELAY_MS = 1000

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
    try {
      await sleep(REQUEST_DELAY_MS)

      const response = await fetch(url, { ...options, headers: { ...githubHeaders(), ...options?.headers } })

      if (response.ok) {
        return await parser(response)
      }

      const status = response.status
      const statusText = response.statusText

      // 403 can be rate limit or abuse; 429 is explicit rate limit
      if (status === 403 || status === 429) {
        const resetWait = getRateLimitReset(response)
        const retryAfter = response.headers.get('retry-after')
        const waitMs = resetWait
          ? resetWait + 1000
          : retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : BASE_RETRY_DELAY_MS * 2 ** attempt

        const remaining = response.headers.get('x-ratelimit-remaining')
        console.warn(`GitHub rate limit hit (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Remaining: ${remaining ?? 'unknown'}. Waiting ${Math.round(waitMs / 1000)}s...`)
        await sleep(waitMs)
        continue
      }

      throw new Error(`GitHub API error: ${status} ${statusText}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

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

/**
 * Fetches a single file from GitHub
 */
async function fetchGitHubFile(downloadUrl: string): Promise<N8nWorkflow> {
  return fetchWithRetry<N8nWorkflow>(downloadUrl)
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

  try {
    onProgress?.(0, 0, `Fetching category: ${categoryName}`)
    const files = await fetchGitHubContents(`workflows/${categoryName}`)
    const workflowFiles = files.filter((f) => f.type === 'file' && f.name.endsWith('.json'))

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
        if (!file.download_url) {
          errors.push(`${file.name}: No download URL`)
          continue
        }

        const n8nWorkflow = await fetchGitHubFile(file.download_url)
        const validation = validateN8nWorkflow(n8nWorkflow)

        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.errors.join(', ')}`)
          continue
        }

        const nexusDefinition = convertN8nToNexus(n8nWorkflow)
        const workflowName = file.name.replace('.json', '')
        const n8nWorkflowName = n8nWorkflow.name || workflowName

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

        // Upload the raw n8n JSON to Supabase Storage
        onProgress?.(i + 1, workflowFiles.length, `Uploading JSON for: ${file.name}`)
        const storagePath = `${categoryName}/${workflowName}.json`

        try {
          const serviceClient = createServiceClient()
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
        
        // Save to database as template
        const { error: insertError } = await supabase
          .from('nexus_workflow_templates')
          .upsert({
            name: workflowName,
            seo_title: seoTitle,
            description,
            category: mapN8nCategoryToNexus(categoryName),
            icon: '⚡',
            color: '#6366f1',
            tags: ['n8n', categoryName],
            difficulty: 'intermediate',
            definition: nexusDefinition,
            source: 'n8n',
            source_url: file.download_url,
            storage_path: storagePath,
            source_metadata: {
              original_name: n8nWorkflowName,
              generated_seo_title: titleWasGenerated,
              n8n_version: n8nWorkflow.version || '1.0',
              node_count: n8nWorkflow.nodes?.length || 0
            }
          }, {
            onConflict: 'name'
          })

        if (insertError) {
          errors.push(`${file.name}: Failed to save to database - ${insertError.message}`)
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
    const categories = await fetchGitHubContents('workflows')
    const workflowCategories = categories.filter((c) => c.type === 'dir')
    result.categories = workflowCategories.length

    let totalFiles = 0
    let processedFiles = 0

    for (const category of workflowCategories) {
      const files = await fetchGitHubContents(category.path)
      totalFiles += files.filter((f) => f.type === 'file' && f.name.endsWith('.json')).length
    }

    onProgress?.(0, totalFiles, `Found ${totalFiles} workflows across ${workflowCategories.length} categories`)

    for (const category of workflowCategories) {
      onProgress?.(processedFiles, totalFiles, `Processing category: ${category.name}`)

      const { workflows, errors } = await scrapeN8nCategory(category.name, (current, total, message) => {
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
