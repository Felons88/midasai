import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { repoFullName } = await req.json()

    if (!repoFullName) {
      return new Response(
        JSON.stringify({ error: 'Repository name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get GitHub connection for user
    const { data: githubConnection, error: connectionError } = await supabaseClient
      .from('github_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connectionError || !githubConnection) {
      return new Response(
        JSON.stringify({ error: 'GitHub connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch repository details
    const repoResponse = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        'Authorization': `Bearer ${githubConnection.github_access_token}`,
        'User-Agent': 'MidasAI-Platform',
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!repoResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch repository' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const repo = await repoResponse.json()

    // Fetch README content
    let readmeContent = ''
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${repoFullName}/readme`, {
        headers: {
          'Authorization': `Bearer ${githubConnection.github_access_token}`,
          'User-Agent': 'MidasAI-Platform',
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json()
        readmeContent = atob(readmeData.content.replace(/\n/g, ''))
      }
    } catch (error) {
      console.log('No README found or error fetching README:', error)
    }

    // Fetch package.json or other config files
    let packageJson = null
    try {
      const packageResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/package.json`, {
        headers: {
          'Authorization': `Bearer ${githubConnection.github_access_token}`,
          'User-Agent': 'MidasAI-Platform',
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (packageResponse.ok) {
        const packageData = await packageResponse.json()
        packageJson = JSON.parse(atob(packageData.content.replace(/\n/g, '')))
      }
    } catch (error) {
      console.log('No package.json found or error fetching:', error)
    }

    // Analyze with Gemini AI
    const analysis = await analyzeRepositoryWithGemini(repo, readmeContent, packageJson)

    // Determine content type based on analysis
    const contentType = determineContentType(repo, packageJson, analysis)

    // Generate tags
    const tags = generateTags(repo, packageJson, analysis, contentType)

    // Set price to null for GitHub projects
    const price = null

    const result = {
      title: analysis.title || repo.name,
      description: analysis.description || repo.description || `A ${contentType} from GitHub repository ${repo.name}`,
      type: contentType,
      tags: tags,
      price: price,
      github_url: repo.html_url,
      readme: readmeContent,
      language: repo.language,
      topics: repo.topics || [],
      license: repo.license ? repo.license.name : null,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      analysis: analysis,
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('GitHub scan repo function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeRepositoryWithGemini(repo: any, readmeContent: string, packageJson: any) {
  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    const prompt = `Analyze this GitHub repository and provide a structured analysis for uploading to a marketplace platform.

Repository Information:
- Name: ${repo.name}
- Description: ${repo.description || 'No description provided'}
- Language: ${repo.language}
- Topics: ${repo.topics ? repo.topics.join(', ') : 'No topics'}
- Stars: ${repo.stargazers_count}
- Forks: ${repo.forks_count}

${readmeContent ? `README Content:\n${readmeContent.substring(0, 8000)}\n` : ''}

${packageJson ? `Package.json:\n${JSON.stringify(packageJson, null, 2)}\n` : ''}

Please provide a JSON response with the following structure:
{
  "title": "A catchy, descriptive title for this project",
  "description": "A comprehensive description highlighting the main features and benefits",
  "category": "SKILL|WORKFLOW|TEMPLATE|PLUGIN",
  "features": ["feature1", "feature2", "feature3"],
  "use_cases": ["use case 1", "use case 2"],
  "target_audience": "who would use this",
  "complexity": "BEGINNER|INTERMEDIATE|ADVANCED",
  "estimated_time": "time to implement/use"
}

Focus on making this appealing for a marketplace audience. Be specific about benefits and use cases.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    })

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const geminiResponse = await response.json()
    const text = geminiResponse.candidates[0].content.parts[0].text

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback if JSON parsing fails
    return {
      title: repo.name,
      description: repo.description || `A ${repo.language} project from GitHub`,
      category: 'SKILL',
      features: [],
      use_cases: [],
      target_audience: 'Developers',
      complexity: 'INTERMEDIATE',
      estimated_time: '30 minutes'
    }
  } catch (error) {
    console.error('Gemini analysis error:', error)
    // Return fallback analysis
    return {
      title: repo.name,
      description: repo.description || `A ${repo.language} project from GitHub`,
      category: 'SKILL',
      features: [],
      use_cases: [],
      target_audience: 'Developers',
      complexity: 'INTERMEDIATE',
      estimated_time: '30 minutes'
    }
  }
}

function determineContentType(repo: any, packageJson: any, analysis: any): string {
  // Use Gemini analysis if available
  if (analysis.category) {
    return analysis.category.toLowerCase()
  }

  // Fallback logic based on repository characteristics
  const name = repo.name.toLowerCase()
  const description = repo.description?.toLowerCase() || ''
  const topics = repo.topics || []
  const language = repo.language?.toLowerCase() || ''

  // Check for workflow indicators
  if (name.includes('workflow') || name.includes('pipeline') || name.includes('automation') ||
      description.includes('workflow') || description.includes('pipeline') ||
      topics.includes('workflow') || topics.includes('automation') ||
      language === 'yaml' || language === 'github-actions') {
    return 'workflow'
  }

  // Check for template indicators
  if (name.includes('template') || name.includes('boilerplate') || name.includes('starter') ||
      description.includes('template') || description.includes('boilerplate') ||
      topics.includes('template') || topics.includes('boilerplate') || topics.includes('starter')) {
    return 'template'
  }

  // Check for plugin/extension indicators
  if (name.includes('plugin') || name.includes('extension') || name.includes('addon') ||
      description.includes('plugin') || description.includes('extension') ||
      topics.includes('plugin') || topics.includes('extension') || topics.includes('addon')) {
    return 'plugin'
  }

  // Default to skill
  return 'skill'
}

function generateTags(repo: any, packageJson: any, analysis: any, contentType: string): string[] {
  const tags = new Set<string>()

  // Add language tag
  if (repo.language) {
    tags.add(repo.language.toLowerCase())
  }

  // Add topics from GitHub
  if (repo.topics) {
    repo.topics.forEach((topic: string) => tags.add(topic.toLowerCase()))
  }

  // Add tags from package.json
  if (packageJson?.keywords) {
    packageJson.keywords.forEach((keyword: string) => tags.add(keyword.toLowerCase()))
  }

  // Add content type tag
  tags.add(contentType)

  // Add common tags based on analysis
  if (analysis.target_audience) {
    tags.add(analysis.target_audience.toLowerCase())
  }

  if (analysis.complexity) {
    tags.add(analysis.complexity.toLowerCase())
  }

  // Add some default tags if set is empty
  if (tags.size === 0) {
    tags.add('open-source')
    tags.add(contentType)
    if (repo.language) {
      tags.add(repo.language.toLowerCase())
    }
  }

  return Array.from(tags).slice(0, 10) // Limit to 10 tags
}
