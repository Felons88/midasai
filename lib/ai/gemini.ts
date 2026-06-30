import { GoogleGenerativeAI } from '@google/generative-ai'

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
