import { GoogleGenerativeAI } from '@google/generative-ai'
import type { NodeDefinition } from '@/lib/nexus/node-registry'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface AIResponse {
  success: boolean
  content?: string
  error?: string
}

export async function generateListingDescription(
  title: string,
  type: string,
  features: string[]
): Promise<AIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
      Generate a compelling description for a ${type} listing on an AI marketplace.
      
      Title: ${title}
      Type: ${type}
      Features: ${features.join(', ')}
      
      Requirements:
      - Write a 2-3 sentence description
      - Highlight key benefits
      - Use professional but engaging language
      - Keep it under 200 characters
      - Do not include markdown formatting
      
      Return only the description text.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return { success: true, content: text.trim() }
  } catch (error) {
    console.error('Gemini AI error:', error)
    return { success: false, error: 'Failed to generate description' }
  }
}

export async function generateTags(
  title: string,
  description: string,
  type: string
): Promise<AIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
      Generate 5-10 relevant tags for a ${type} listing.
      
      Title: ${title}
      Description: ${description}
      
      Requirements:
      - Return tags as a comma-separated list
      - Tags should be lowercase
      - Use hyphens for multi-word tags (e.g., "machine-learning")
      - Focus on technical keywords and categories
      - Do not include the type as a tag
      
      Return only the comma-separated tags.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const tags = text
      .split(',')
      .map(tag => tag.trim().toLowerCase().replace(/\s+/g, '-'))
      .filter(tag => tag.length > 0)

    return { success: true, content: tags.join(',') }
  } catch (error) {
    console.error('Gemini AI error:', error)
    return { success: false, error: 'Failed to generate tags' }
  }
}

export async function analyzeRepository(
  repoName: string,
  description: string,
  readme: string
): Promise<AIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
      Analyze this GitHub repository and generate a marketplace listing.
      
      Repository: ${repoName}
      Description: ${description || 'No description provided'}
      
      README (first 5000 characters):
      ${readme.substring(0, 5000)}
      
      Generate a JSON response with:
      - title: A catchy, descriptive title (max 60 chars)
      - description: A compelling description (max 200 chars)
      - type: One of SKILL, WORKFLOW, TEMPLATE, or PLUGIN
      - tags: 5-10 relevant tags as a comma-separated list
      - price: "Free" (GitHub projects are free)
      
      Return only valid JSON, no markdown.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: 'Failed to parse AI response' }
    }

    return { success: true, content: jsonMatch[0] }
  } catch (error) {
    console.error('Gemini AI error:', error)
    return { success: false, error: 'Failed to analyze repository' }
  }
}

export async function generateSmartSuggestions(
  query: string,
  context: string = ''
): Promise<AIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
      Generate 5 search suggestions for an AI marketplace based on the user's query.
      
      Query: ${query}
      Context: ${context}
      
      Requirements:
      - Return suggestions as a comma-separated list
      - Suggestions should be related to AI skills, workflows, or templates
      - Keep suggestions short and relevant
      - Focus on popular search terms
      
      Return only the comma-separated suggestions.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const suggestions = text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    return { success: true, content: suggestions.join(',') }
  } catch (error) {
    console.error('Gemini AI error:', error)
    return { success: false, error: 'Failed to generate suggestions' }
  }
}

export async function generateWorkflowTitle(
  existingTitle: string,
  workflowJson: object
): Promise<AIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const workflowSummary = JSON.stringify(workflowJson, null, 2).substring(0, 4000)

    const prompt = `
      Generate a clear, SEO-friendly title for an n8n workflow template.

      Existing title / filename: ${existingTitle}

      Workflow JSON (truncated):
      ${workflowSummary}

      Requirements:
      - Use the existing title/filename plus the workflow contents to create a descriptive title
      - Explain what the workflow does (e.g. "Send Slack alerts from GitHub issues")
      - Remove emojis, special formatting, IDs, and underscores
      - Use plain, searchable language
      - Keep it under 60 characters
      - Do not include markdown, quotes, numbering, or file extensions
      - Return only the title text, nothing else
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Remove surrounding quotes if present
    const cleanTitle = text.replace(/^["']|["']$/g, '').trim()

    if (cleanTitle.length === 0) {
      return { success: false, error: 'AI returned empty title' }
    }

    return { success: true, content: cleanTitle }
  } catch (error) {
    console.error('Gemini AI error:', error)
    return { success: false, error: 'Failed to generate workflow title' }
  }
}

/**
 * Creates a readable fallback title from a raw filename / n8n workflow name.
 */
export function generateFallbackTitle(rawName: string): string {
  if (!rawName) return 'Untitled Workflow'

  // Remove common file prefixes like "1521_" and file extensions
  let cleaned = rawName
    .replace(/^\d+[_-]+/, '')
    .replace(/\.json$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()

  // Insert spaces before camelCase boundaries
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2')

  // Title case
  return cleaned
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 60)
}

/**
 * Generates a concise description for an n8n workflow based on title and content.
 */
export async function generateWorkflowDescription(
  workflowTitle: string,
  workflowJson: object
): Promise<AIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const workflowSummary = JSON.stringify(workflowJson, null, 2).substring(0, 3000)

    const prompt = `
      Write a one-sentence description for an n8n workflow template.

      Title: ${workflowTitle}

      Workflow JSON (truncated):
      ${workflowSummary}

      Requirements:
      - Explain what the workflow automates and the value it provides
      - Use plain, searchable language
      - Keep it under 140 characters
      - Do not include markdown, quotes, or emojis
      - Return only the description text, nothing else
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()
    const cleanDescription = text.replace(/^["']|["']$/g, '').trim()

    if (cleanDescription.length === 0) {
      return { success: false, error: 'AI returned empty description' }
    }

    return { success: true, content: cleanDescription }
  } catch (error) {
    console.error('Gemini AI error:', error)
    return { success: false, error: 'Failed to generate workflow description' }
  }
}

/**
 * Creates a simple fallback description from the workflow title.
 */
export function generateFallbackDescription(workflowTitle: string): string {
  if (!workflowTitle) return 'Automated workflow template.'
  const lower = workflowTitle.toLowerCase()
  if (lower.includes('slack') && lower.includes('alert')) return 'Sends Slack alerts automatically based on trigger events.'
  if (lower.includes('email')) return 'Automates email notifications and follow-ups.'
  if (lower.includes('github')) return 'Automates GitHub repository actions and notifications.'
  if (lower.includes('google')) return 'Integrates with Google services to automate workflows.'
  if (lower.includes('ai') || lower.includes('gpt') || lower.includes('openai')) return 'Uses AI to process and automate tasks.'
  if (lower.includes('crm')) return 'Automates CRM data sync and customer actions.'
  if (lower.includes('database') || lower.includes('postgres') || lower.includes('mysql')) return 'Syncs and automates database operations.'
  if (lower.includes('webhook')) return 'Receives webhook events and triggers automated actions.'
  if (lower.includes('schedule') || lower.includes('cron')) return 'Runs scheduled automation tasks.'
  return `Automates ${workflowTitle.toLowerCase()} tasks without manual work.`
}

/**
 * Generates a best-effort Nexus NodeDefinition from an n8n node type and sample JSON.
 */
export async function generateNodeDefinition(
  n8nType: string,
  sampleNode: object
): Promise<{ success: boolean; content?: NodeDefinition; error?: string }> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const nexusId = n8nType.replace(/^n8n-nodes-base\./, '')
    const sampleJson = JSON.stringify(sampleNode, null, 2).substring(0, 3000)

    const prompt = `
      Generate a Nexus-style node definition for the n8n node type "${n8nType}".

      Sample n8n node JSON:
      ${sampleJson}

      Requirements for the NodeDefinition JSON:
      - id: "${nexusId}"
      - name: a short, readable name (e.g. "Stripe" instead of "n8n-nodes-base.stripeTrigger")
      - description: one sentence explaining what this node does
      - category: pick one of [ai, llm, image, audio, developer, database, cloud, logic, files, midas, analytics, browser, ide, communication, data, devops, finance, crm, utility]
      - icon: a single emoji that represents the service
      - color: a hex brand color as a string
      - inputs: array of ports. Always include a "trigger" port for trigger nodes, otherwise include a default "input" port. Each port is { id, label, type }.
      - outputs: array of ports. Always include a default "output" port. Each port is { id, label, type }.
      - fields: array of config fields based on the sample node parameters. Each field is { key, label, type, required?, default?, description?, placeholder? }. Use types: string, number, boolean, select, textarea, json, code, secret, url, credential.
      - credentials: array of credential provider strings if the sample node has credentials, otherwise empty array.
      - executor: a short snake_case string like "${nexusId}_node"
      - tags: array of relevant lowercase strings

      Return ONLY valid JSON matching the NodeDefinition structure, no markdown, no explanation.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Strip any markdown code fence
    const cleanJson = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleanJson)

    if (!parsed.id || !parsed.name || !parsed.executor) {
      return { success: false, error: 'Generated node definition missing required fields' }
    }

    const def: NodeDefinition = {
      id: parsed.id,
      name: parsed.name,
      description: parsed.description || '',
      category: parsed.category || 'utility',
      icon: parsed.icon || '⚙️',
      color: parsed.color || '#a3a3a3',
      inputs: Array.isArray(parsed.inputs) ? parsed.inputs : [{ id: 'input', label: 'Input', type: 'any' }],
      outputs: Array.isArray(parsed.outputs) ? parsed.outputs : [{ id: 'output', label: 'Output', type: 'any' }],
      credentials: Array.isArray(parsed.credentials) ? parsed.credentials : undefined,
      fields: Array.isArray(parsed.fields) ? parsed.fields : [],
      executor: parsed.executor,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    }

    return { success: true, content: def }
  } catch (error) {
    console.error('Gemini AI node generation error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate node definition' }
  }
}

export async function improveDescription(
  currentDescription: string,
  type: string
): Promise<AIResponse> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'Gemini API not configured' }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
      Improve this ${type} description to make it more compelling and professional.
      
      Current description: ${currentDescription}
      
      Requirements:
      - Keep the core message but make it more engaging
      - Use stronger, more descriptive language
      - Highlight benefits and value proposition
      - Keep it under 200 characters
      - Do not include markdown formatting
      
      Return only the improved description.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return { success: true, content: text.trim() }
  } catch (error) {
    console.error('Gemini AI error:', error)
    return { success: false, error: 'Failed to improve description' }
  }
}
