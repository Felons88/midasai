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
    const { data: connection, error: connectionError } = await supabase
      .from('github_connections')
      .select('github_access_token')
      .eq('user_id', user.id)
      .single()

    if (connectionError || !connection) {
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

    // Fetch README
    const readmeResponse = await fetch(`https://api.github.com/repos/${repoFullName}/readme`, {
      headers: {
        'Authorization': `Bearer ${connection.github_access_token}`,
        'User-Agent': 'MidasAI-Platform',
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    let readme = ''
    if (readmeResponse.ok) {
      const readmeData = await readmeResponse.json()
      const contentResponse = await fetch(readmeData.download_url)
      readme = await contentResponse.text()
    }

    // AI Analysis using Gemini
    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      return NextResponse.json({ error: 'Gemini API not configured' }, { status: 500 })
    }

    const analysisPrompt = `
      Analyze this GitHub repository and generate a marketplace listing:
      
      Repository: ${repoData.full_name}
      Description: ${repoData.description || 'No description'}
      Language: ${repoData.language || 'Unknown'}
      Topics: ${repoData.topics?.join(', ') || 'None'}
      
      README:
      ${readme.substring(0, 10000)}
      
      Generate a JSON response with:
      - title: A catchy, descriptive title (max 60 chars)
      - description: A compelling description (max 500 chars)
      - type: One of SKILL, WORKFLOW, TEMPLATE, or PLUGIN
      - tags: 5-10 relevant tags as an array
      - price: "Free" (GitHub projects are free)
      - github_url: ${repoData.html_url}
      
      Return only valid JSON, no markdown.
    `

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: analysisPrompt }]
        }]
      })
    })

    if (!geminiResponse.ok) {
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    const geminiData = await geminiResponse.json()
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON from AI response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const analysisResult = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      ...analysisResult,
      readme: readme.substring(0, 5000), // Store first 5000 chars
    })
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
