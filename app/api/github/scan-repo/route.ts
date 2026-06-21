import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBody, githubRepoSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = await validateBody(githubRepoSchema, body)
    
    const { repoFullName } = validatedData

    // Get GitHub connection
    const { data: connection } = await supabase
      .from('github_connections')
      .select('github_access_token')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!connection?.github_access_token) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    // Fetch repository details from GitHub
    const repoResponse = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        'Authorization': `Bearer ${connection.github_access_token}`,
        'User-Agent': 'MidasAI-Platform',
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!repoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch repository' }, { status: 500 })
    }

    const repoData = await repoResponse.json()

    const ghHeaders = {
      'Authorization': `Bearer ${connection.github_access_token}`,
      'User-Agent': 'MidasAI-Platform',
      'Accept': 'application/vnd.github.v3+json',
    }

    // Fetch README
    let readme = ''
    const readmeResponse = await fetch(`https://api.github.com/repos/${repoFullName}/readme`, { headers: ghHeaders })
    if (readmeResponse.ok) {
      const readmeData = await readmeResponse.json()
      const contentResponse = await fetch(readmeData.download_url)
      readme = await contentResponse.text()
    }

    // Fetch repo tree to find key files
    let packageJson: Record<string, any> = {}
    const treeResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/HEAD?recursive=1`, { headers: ghHeaders })
    if (treeResponse.ok) {
      const treeData = await treeResponse.json()
      const pkgFile = treeData.tree?.find((f: any) => f.path === 'package.json')
      if (pkgFile) {
        const pkgResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/package.json`, { headers: ghHeaders })
        if (pkgResponse.ok) {
          const pkgData = await pkgResponse.json()
          try {
            packageJson = JSON.parse(Buffer.from(pkgData.content, 'base64').toString())
          } catch {}
        }
      }
    }

    // Build rich context from all available data
    const repoContext = {
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description || packageJson.description || '',
      language: repoData.language,
      topics: repoData.topics || [],
      stars: repoData.stargazers_count,
      packageName: packageJson.name,
      packageKeywords: packageJson.keywords || [],
      dependencies: Object.keys(packageJson.dependencies || {}),
      readme: readme.substring(0, 10000),
    }

    // Derive tags from all sources
    const langTag = repoContext.language?.toLowerCase()
    const allTags: string[] = [
      ...repoContext.topics,
      ...repoContext.packageKeywords,
      ...(langTag ? [langTag] : []),
      'open-source',
    ].filter((v): v is string => typeof v === 'string' && v.length > 0)
     .filter((v, i, a) => a.indexOf(v) === i)
     .slice(0, 10)

    // Detect type from dependencies and name
    const depString = repoContext.dependencies.join(' ').toLowerCase()
    const nameStr = repoContext.name.toLowerCase()
    let detectedType = 'SKILL'
    if (nameStr.includes('workflow') || nameStr.includes('pipeline') || depString.includes('n8n')) detectedType = 'WORKFLOW'
    else if (nameStr.includes('template') || nameStr.includes('boilerplate') || nameStr.includes('starter')) detectedType = 'TEMPLATE'
    else if (nameStr.includes('plugin') || nameStr.includes('extension') || depString.includes('vscode')) detectedType = 'PLUGIN'

    const fallbackResult = {
      title: repoContext.name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: repoContext.description || `A ${repoContext.language || 'code'} project: ${repoContext.name}`,
      type: detectedType,
      tags: allTags,
      price: 0,
      github_url: repoData.html_url,
      readme: readme.substring(0, 5000),
    }

    // AI Analysis using OpenRouter
    const openrouterKey = process.env.OPENROUTER_API_KEY
    if (!openrouterKey) {
      return NextResponse.json(fallbackResult)
    }

    const analysisPrompt = `Analyze this GitHub repository and generate a marketplace listing for an AI tools marketplace.

Repository: ${repoContext.fullName}
Description: ${repoContext.description || 'No description'}
Language: ${repoContext.language || 'Unknown'}
Topics: ${repoContext.topics.join(', ') || 'None'}
Dependencies: ${repoContext.dependencies.slice(0, 20).join(', ') || 'None'}
Keywords: ${repoContext.packageKeywords.join(', ') || 'None'}

README (first 6000 chars):
${repoContext.readme}

Generate a JSON response with these exact fields:
- title: A catchy, descriptive title for the marketplace listing (max 60 chars)
- description: A compelling SEO-optimized description explaining what this does and who it's for (min 100 chars, max 500 chars)
- type: One of SKILL, WORKFLOW, TEMPLATE, or PLUGIN based on what this repo actually is
- tags: Array of 5-10 relevant tags (lowercase, hyphen-separated)
- price: 0
- github_url: "${repoData.html_url}"

Return ONLY a valid JSON object. No markdown, no code fences, no explanation.`

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://midasai.tech',
        'X-Title': 'MidasAI',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{ role: 'user', content: analysisPrompt }],
        max_tokens: 1000,
        temperature: 0.3,
      })
    })

    if (!aiResponse.ok) {
      const aiError = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, aiError.substring(0, 500))
      return NextResponse.json(fallbackResult)
    }

    const aiData = await aiResponse.json()
    const aiText = aiData.choices?.[0]?.message?.content || ''

    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Failed to parse OpenRouter response:', aiText.substring(0, 300))
      return NextResponse.json(fallbackResult)
    }

    try {
      const analysisResult = JSON.parse(jsonMatch[0])
      return NextResponse.json({
        ...analysisResult,
        price: typeof analysisResult.price === 'number' ? analysisResult.price : 0,
        tags: Array.isArray(analysisResult.tags) ? analysisResult.tags : allTags,
        readme: readme.substring(0, 5000),
      })
    } catch {
      return NextResponse.json(fallbackResult)
    }
  } catch (error) {
    console.error('GitHub scan-repo error:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.startsWith('[')) {
      const validationErrors = JSON.parse(error.message)
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
