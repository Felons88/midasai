import { convertN8nToNexus, validateN8nWorkflow, type N8nWorkflow } from './n8n-converter'

const GITHUB_REPO = 'zie619/n8n-workflows'
const GITHUB_API_BASE = 'https://api.github.com/repos'

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

/**
 * Fetches directory contents from GitHub API
 */
async function fetchGitHubContents(path: string): Promise<GitHubContent[]> {
  const url = `${GITHUB_API_BASE}/${GITHUB_REPO}/contents/${path}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetches a single file from GitHub
 */
async function fetchGitHubFile(downloadUrl: string): Promise<N8nWorkflow> {
  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`)
  }
  return response.json()
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
 * Scrapes a single workflow category
 */
export async function scrapeN8nCategory(
  categoryName: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ workflows: Array<{ name: string; definition: any; n8nWorkflow: N8nWorkflow }>; errors: string[] }> {
  const workflows: Array<{ name: string; definition: any; n8nWorkflow: N8nWorkflow }> = []
  const errors: string[] = []

  try {
    onProgress?.(0, 0, `Fetching category: ${categoryName}`)
    const files = await fetchGitHubContents(`workflows/${categoryName}`)
    const workflowFiles = files.filter((f) => f.type === 'file' && f.name.endsWith('.json'))

    onProgress?.(0, workflowFiles.length, `Found ${workflowFiles.length} workflows`)

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
        workflows.push({
          name: file.name.replace('.json', ''),
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
