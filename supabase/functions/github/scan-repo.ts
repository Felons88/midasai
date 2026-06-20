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

    // CRITICAL SECURITY: Verify repository ownership
    if (repo.owner.login !== githubConnection.github_username) {
      return new Response(
        JSON.stringify({ 
          error: 'REPOSITORY_OWNERSHIP_VERIFICATION_FAILED',
          message: 'You can only upload repositories that you own',
          details: `Repository owner: ${repo.owner.login}, Your GitHub username: ${githubConnection.github_username}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Additional security checks
    if (repo.fork) {
      return new Response(
        JSON.stringify({ 
          error: 'FORKED_REPOSITORY_NOT_ALLOWED',
          message: 'Forked repositories cannot be uploaded to the marketplace',
          details: 'Please upload the original repository instead of a fork'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Comprehensive file scanning for AI analysis
    const scannedFiles = {
      readme: '',
      packageJson: null,
      pyprojectToml: null,
      requirementsTxt: '',
      cargoToml: null,
      mcpManifests: [],
      cursorRules: [],
      claudeSkills: [],
      windsurfConfigs: [],
      additionalFiles: {}
    }

    // Fetch README content
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
        scannedFiles.readme = atob(readmeData.content.replace(/\n/g, ''))
      }
    } catch (error) {
      console.log('No README found or error fetching README:', error)
    }

    // Fetch package.json
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
        scannedFiles.packageJson = JSON.parse(atob(packageData.content.replace(/\n/g, '')))
      }
    } catch (error) {
      console.log('No package.json found or error fetching:', error)
    }

    // Fetch pyproject.toml for Python projects
    try {
      const pyprojectResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/pyproject.toml`, {
        headers: {
          'Authorization': `Bearer ${githubConnection.github_access_token}`,
          'User-Agent': 'MidasAI-Platform',
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (pyprojectResponse.ok) {
        const pyprojectData = await pyprojectResponse.json()
        scannedFiles.pyprojectToml = atob(pyprojectData.content.replace(/\n/g, ''))
      }
    } catch (error) {
      console.log('No pyproject.toml found or error fetching:', error)
    }

    // Fetch requirements.txt for Python projects
    try {
      const requirementsResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/requirements.txt`, {
        headers: {
          'Authorization': `Bearer ${githubConnection.github_access_token}`,
          'User-Agent': 'MidasAI-Platform',
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (requirementsResponse.ok) {
        const requirementsData = await requirementsResponse.json()
        scannedFiles.requirementsTxt = atob(requirementsData.content.replace(/\n/g, ''))
      }
    } catch (error) {
      console.log('No requirements.txt found or error fetching:', error)
    }

    // Fetch Cargo.toml for Rust projects
    try {
      const cargoResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/Cargo.toml`, {
        headers: {
          'Authorization': `Bearer ${githubConnection.github_access_token}`,
          'User-Agent': 'MidasAI-Platform',
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (cargoResponse.ok) {
        const cargoData = await cargoResponse.json()
        scannedFiles.cargoToml = atob(cargoData.content.replace(/\n/g, ''))
      }
    } catch (error) {
      console.log('No Cargo.toml found or error fetching:', error)
    }

    // Scan for MCP manifests
    const mcpPatterns = ['mcp.json', 'claude_desktop_config.json', '.mcp/*']
    for (const pattern of mcpPatterns) {
      try {
        const searchResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${pattern}`, {
          headers: {
            'Authorization': `Bearer ${githubConnection.github_access_token}`,
            'User-Agent': 'MidasAI-Platform',
            'Accept': 'application/vnd.github.v3+json',
          },
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (Array.isArray(searchData)) {
            scannedFiles.mcpManifests.push(...searchData.map((file: any) => ({
              name: file.name,
              path: file.path,
              type: 'directory'
            })))
          } else {
            scannedFiles.mcpManifests.push({
              name: searchData.name,
              path: searchData.path,
              type: 'file'
            })
          }
        }
      } catch (error) {
        console.log(`No MCP manifest found for pattern ${pattern}:`, error)
      }
    }

    // Scan for Cursor rules
    const cursorPatterns = ['.cursorrules', '.cursor/*']
    for (const pattern of cursorPatterns) {
      try {
        const searchResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${pattern}`, {
          headers: {
            'Authorization': `Bearer ${githubConnection.github_access_token}`,
            'User-Agent': 'MidasAI-Platform',
            'Accept': 'application/vnd.github.v3+json',
          },
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (Array.isArray(searchData)) {
            scannedFiles.cursorRules.push(...searchData.map((file: any) => ({
              name: file.name,
              path: file.path
            })))
          } else {
            scannedFiles.cursorRules.push({
              name: searchData.name,
              path: searchData.path
            })
          }
        }
      } catch (error) {
        console.log(`No Cursor rules found for pattern ${pattern}:`, error)
      }
    }

    // Scan for Claude skills
    const skillPatterns = ['*.skill', 'skills/*', '.claude/*']
    for (const pattern of skillPatterns) {
      try {
        const searchResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${pattern}`, {
          headers: {
            'Authorization': `Bearer ${githubConnection.github_access_token}`,
            'User-Agent': 'MidasAI-Platform',
            'Accept': 'application/vnd.github.v3+json',
          },
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (Array.isArray(searchData)) {
            scannedFiles.claudeSkills.push(...searchData.map((file: any) => ({
              name: file.name,
              path: file.path
            })))
          } else {
            scannedFiles.claudeSkills.push({
              name: searchData.name,
              path: searchData.path
            })
          }
        }
      } catch (error) {
        console.log(`No Claude skills found for pattern ${pattern}:`, error)
      }
    }

    // Scan for Windsurf configs
    const windsurfPatterns = ['windsurf.json', '.windsurf/*']
    for (const pattern of windsurfPatterns) {
      try {
        const searchResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${pattern}`, {
          headers: {
            'Authorization': `Bearer ${githubConnection.github_access_token}`,
            'User-Agent': 'MidasAI-Platform',
            'Accept': 'application/vnd.github.v3+json',
          },
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (Array.isArray(searchData)) {
            scannedFiles.windsurfConfigs.push(...searchData.map((file: any) => ({
              name: file.name,
              path: file.path
            })))
          } else {
            scannedFiles.windsurfConfigs.push({
              name: searchData.name,
              path: searchData.path
            })
          }
        }
      } catch (error) {
        console.log(`No Windsurf configs found for pattern ${pattern}:`, error)
      }
    }

    // Analyze with Gemini AI using comprehensive file data
    const analysis = await analyzeRepositoryWithGemini(repo, scannedFiles)

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

async function analyzeRepositoryWithGemini(repo: any, scannedFiles: any) {
  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    // Build comprehensive analysis prompt
    let analysisPrompt = `Analyze this GitHub repository comprehensively for marketplace listing generation.

Repository Information:
- Name: ${repo.name}
- Description: ${repo.description || 'No description provided'}
- Language: ${repo.language}
- Topics: ${repo.topics ? repo.topics.join(', ') : 'No topics'}
- Stars: ${repo.stargazers_count}
- Forks: ${repo.forks_count}
- Private: ${repo.private}
- License: ${repo.license ? repo.license.name : 'No license'}

${scannedFiles.readme ? `README Content:\n${scannedFiles.readme.substring(0, 6000)}\n` : ''}

${scannedFiles.packageJson ? `Package.json:\n${JSON.stringify(scannedFiles.packageJson, null, 2)}\n` : ''}

${scannedFiles.pyprojectToml ? `pyproject.toml:\n${scannedFiles.pyprojectToml.substring(0, 2000)}\n` : ''}

${scannedFiles.requirementsTxt ? `requirements.txt:\n${scannedFiles.requirementsTxt.substring(0, 1000)}\n` : ''}

${scannedFiles.cargoToml ? `Cargo.toml:\n${scannedFiles.cargoToml.substring(0, 2000)}\n` : ''}

Detected AI/Dev Tools Files:
- MCP Manifests: ${scannedFiles.mcpManifests.length} found
- Cursor Rules: ${scannedFiles.cursorRules.length} found  
- Claude Skills: ${scannedFiles.claudeSkills.length} found
- Windsurf Configs: ${scannedFiles.windsurfConfigs.length} found

Please provide a comprehensive JSON analysis with the following structure:
{
  "title": "A catchy, descriptive title for this project",
  "short_description": "A brief one-sentence description for the marketplace",
  "long_description": "A comprehensive description highlighting main features, benefits, and use cases",
  "category": "SKILL|WORKFLOW|TEMPLATE|PLUGIN|MCP|CURSOR_RULE|CLAUDE_SKILL|WINDSURF_CONFIG",
  "skill_type": "AUTOMATION|ANALYSIS|GENERATION|INTEGRATION|UTILITY",
  "workflow_type": "DEPLOYMENT|DEVELOPMENT|TESTING|MONITORING|AUTOMATION",
  "mcp_classification": "TOOL|RESOURCE|SERVER|CLIENT",
  "features": ["feature1", "feature2", "feature3", "feature4"],
  "use_cases": ["use case 1", "use case 2", "use case 3"],
  "target_audience": "who would use this (be specific)",
  "complexity": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
  "estimated_time": "time to implement/use (e.g., '5 minutes', '1 hour')",
  "installation_steps": ["step 1", "step 2", "step 3"],
  "dependencies": ["dependency1", "dependency2"],
  "supported_platforms": ["platform1", "platform2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Focus on:
1. Creating marketplace-ready content that sells the value
2. Identifying the specific type of AI tool or workflow
3. Being specific about benefits and use cases
4. Including practical installation and usage information
5. Generating relevant tags for discoverability`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
        }
      })
    })
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
