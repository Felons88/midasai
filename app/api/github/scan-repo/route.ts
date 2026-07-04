import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runWithAIReservation } from '@/lib/billing/ai-reservation'

const FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-12b-it:free',
]

function extractProjectSummary(readme: string): string {
  // Lines that describe the project itself (not instructions to an AI)
  const SKIP_PATTERNS = [
    /you are a/i, /your job/i, /your role/i, /working style/i,
    /before making/i, /read project/i, /understand the/i,
    /never leave/i, /always/i, /do not/i, /must /i,
    /^##/, /^---/, /^\[no readme/i,
  ]

  const lines = readme.split('\n').map(l => l.trim()).filter(Boolean)
  const goodLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('//') || line.startsWith('#') || line.startsWith('[')) continue
    if (line.length < 30) continue
    if (line.includes('.md,') || line.includes('.ts,') || line.includes('.js,')) continue
    if (SKIP_PATTERNS.some(p => p.test(line))) continue
    // Real project description lines
    if (line.match(/marketplace|platform|tool|library|framework|app|system|api|server|client/i)) {
      goodLines.push(line)
      if (goodLines.length >= 3) break
    }
  }

  return goodLines.join(' ').substring(0, 400)
}

function buildFallback(repoData: any, packageJson: any, readme: string) {
  const name: string = repoData.name || ''
  const lang: string = (repoData.language || '').toLowerCase()
  const topics: string[] = repoData.topics || []
  const keywords: string[] = packageJson?.keywords || []
  const deps = Object.keys(packageJson?.dependencies || {})
  const depStr = deps.join(' ').toLowerCase()
  const nameStr = name.toLowerCase()

  let type = 'SKILL'
  if (nameStr.includes('workflow') || nameStr.includes('pipeline') || depStr.includes('n8n')) type = 'WORKFLOW'
  else if (nameStr.includes('template') || nameStr.includes('boilerplate') || nameStr.includes('starter')) type = 'TEMPLATE'
  else if (nameStr.includes('plugin') || nameStr.includes('extension') || depStr.includes('vscode')) type = 'PLUGIN'

  // Detect type from deps too
  if (depStr.includes('next') || depStr.includes('react')) type = type === 'SKILL' ? 'TEMPLATE' : type

  // Build tags from all sources + infer from deps
  const depTags: string[] = []
  if (depStr.includes('next')) depTags.push('nextjs')
  if (depStr.includes('react')) depTags.push('react')
  if (depStr.includes('supabase')) depTags.push('supabase')
  if (depStr.includes('stripe')) depTags.push('stripe')
  if (depStr.includes('tailwind')) depTags.push('tailwindcss')
  if (depStr.includes('openai')) depTags.push('openai')
  if (depStr.includes('anthropic')) depTags.push('anthropic')
  if (depStr.includes('prisma')) depTags.push('prisma')
  if (depStr.includes('express')) depTags.push('express')
  if (depStr.includes('fastapi') || depStr.includes('flask') || depStr.includes('django')) depTags.push('python-api')

  const tags: string[] = [...topics, ...keywords, ...depTags, ...(lang ? [lang] : []), 'open-source']
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10)

  // Try to get a real description
  const extractedDesc = extractProjectSummary(readme)
  const description = repoData.description
    || packageJson?.description
    || extractedDesc
    || `Open source ${lang || 'code'} project: ${name.replace(/-/g, ' ')}. Browse the repository to learn more.`

  return {
    title: name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    description,
    type,
    tags,
    price: 0,
    github_url: repoData.html_url,
    readme: readme.substring(0, 5000),
  }
}

async function tryOpenRouter(key: string, prompt: string): Promise<string | null> {
  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://midasai.tech',
          'X-Title': 'MidasAI',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 600,
          temperature: 0.2,
        }),
      })

      if (!res.ok) {
        console.error(`OpenRouter ${model} error:`, res.status, (await res.text()).substring(0, 200))
        continue
      }

      const data = await res.json()
      const text: string = data.choices?.[0]?.message?.content || ''
      if (text.includes('{')) return text
    } catch (e) {
      console.error(`OpenRouter ${model} threw:`, e)
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const repoFullName: string = body?.repoFullName
    if (!repoFullName || !repoFullName.includes('/')) {
      return NextResponse.json({ error: 'repoFullName is required (owner/repo)' }, { status: 400 })
    }

    const { data: connection } = await supabase
      .from('github_connections')
      .select('github_access_token')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!connection?.github_access_token) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 })
    }

    const gh = {
      'Authorization': `Bearer ${connection.github_access_token}`,
      'User-Agent': 'MidasAI-Platform',
      'Accept': 'application/vnd.github.v3+json',
    }

    // Parallel fetch: repo info, readme, package.json
    const [repoRes, readmeRes, pkgRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoFullName}`, { headers: gh }),
      fetch(`https://api.github.com/repos/${repoFullName}/readme`, { headers: gh }),
      fetch(`https://api.github.com/repos/${repoFullName}/contents/package.json`, { headers: gh }),
    ])

    if (!repoRes.ok) {
      return NextResponse.json({ error: 'Repository not found or no access' }, { status: 400 })
    }

    const repoData = await repoRes.json()

    let readme = ''
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json()
      const raw = await fetch(readmeData.download_url)
      if (raw.ok) readme = (await raw.text()).substring(0, 3000)
    }

    let packageJson: Record<string, any> = {}
    if (pkgRes.ok) {
      const pkgData = await pkgRes.json()
      try { packageJson = JSON.parse(Buffer.from(pkgData.content, 'base64').toString()) } catch {}
    }

    // If no README, scan repo files to build context
    if (!readme) {
      const treeRes = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees/HEAD?recursive=1`, { headers: gh })
      if (treeRes.ok) {
        const treeData = await treeRes.json()
        const allFiles: string[] = (treeData.tree || [])
          .filter((f: any) => f.type === 'blob')
          .map((f: any) => f.path as string)

        // Priority files to read for context
        const PRIORITY = [
          'index.ts', 'index.js', 'index.tsx', 'index.jsx',
          'main.ts', 'main.js', 'main.py', 'app.py', 'app.ts', 'app.js',
          'src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.py',
          'claude.md', 'CLAUDE.md', 'agent.md', 'AGENT.md',
          '.cursorrules', 'cursorrules.md',
          'pyproject.toml', 'requirements.txt', 'Cargo.toml', 'go.mod',
          'docker-compose.yml', 'Dockerfile',
        ]

        // Readable text extensions
        const TEXT_EXT = ['.ts','.tsx','.js','.jsx','.py','.go','.rs','.md','.txt','.toml','.yml','.yaml','.json']

        const toRead = [
          // Priority files first
          ...PRIORITY.filter(p => allFiles.includes(p)),
          // Then any src/ files that are text
          ...allFiles.filter(f =>
            f.startsWith('src/') &&
            TEXT_EXT.some(ext => f.endsWith(ext)) &&
            !PRIORITY.includes(f)
          ).slice(0, 8),
          // Then root-level text files
          ...allFiles.filter(f =>
            !f.includes('/') &&
            TEXT_EXT.some(ext => f.endsWith(ext)) &&
            !PRIORITY.includes(f) &&
            f !== 'package.json'
          ).slice(0, 4),
        ].slice(0, 12) // max 12 files

        const fileContents = await Promise.all(
          toRead.map(async (path) => {
            try {
              const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${path}`, { headers: gh })
              if (!res.ok) return null
              const data = await res.json()
              if (!data.content) return null
              const text = Buffer.from(data.content, 'base64').toString().substring(0, 400)
              return `// ${path}\n${text}`
            } catch { return null }
          })
        )

        const scanned = fileContents.filter(Boolean).join('\n\n')
        if (scanned) {
          readme = `[No README — scanned ${toRead.length} files]\n\nFile listing (${allFiles.length} total):\n${allFiles.slice(0, 30).join(', ')}\n\nKey file contents:\n${scanned}`.substring(0, 3000)
        }
      }
    }

    const fallback = buildFallback(repoData, packageJson, readme)

    const openrouterKey = process.env.OPENROUTER_API_KEY
    if (!openrouterKey) return NextResponse.json(fallback)

    const cleanContent = readme
      .replace(/you are a senior/gi, '')
      .replace(/your job is to/gi, '')
      .substring(0, 2000)

    const prompt = `You are a copywriter creating a marketplace listing for an AI tools marketplace called MidasAI.

REPO INFO:
- Name: ${repoData.full_name}
- Language: ${repoData.language || 'Unknown'}
- GitHub description: ${repoData.description || 'None'}
- Dependencies: ${Object.keys(packageJson?.dependencies || {}).slice(0, 20).join(', ') || 'None'}
- Topics/Keywords: ${[...(repoData.topics || []), ...(packageJson?.keywords || [])].join(', ') || 'None'}

REPO CONTENT (from files):
${cleanContent}

Write a marketplace listing. Rules:
- title: Short, catchy product name (NOT the repo name, make it descriptive, max 60 chars)
- description: 2-3 sentences. First sentence: what it IS and does. Second: key features or tech stack highlights. Third: who it's for. NO "You are" or "your job" language. Write as if describing a product to a buyer. Min 120 chars, max 480 chars.
- type: SKILL, WORKFLOW, TEMPLATE, or PLUGIN
- tags: 6-10 lowercase tags from the actual tech stack and use case
- price: 0
- github_url: "${repoData.html_url}"

Reply with ONLY this JSON, no markdown, no explanation:
{"title":"...","description":"...","type":"...","tags":["...","..."],"price":0,"github_url":"${repoData.html_url}"}`

    const aiResult = await runWithAIReservation(
      { supabase, userId: user.id },
      {
        featureKey: "github_repository_analysis",
        operationId: `github-scan-${user.id}-${Date.now()}`,
        provider: "openrouter",
      },
      async () => {
        const aiText = await tryOpenRouter(openrouterKey, prompt)
        if (!aiText) throw new Error("AI generation failed")
        
        const match = aiText.match(/\{[\s\S]*?\}(?=\s*$|\s*```)/)?.[0] || aiText.match(/\{[\s\S]*\}/)?.[0]
        if (!match) throw new Error("Failed to parse AI response")
        
        try {
          const result = JSON.parse(match)
          return {
            title: result.title || fallback.title,
            description: result.description || fallback.description,
            type: ['SKILL','WORKFLOW','TEMPLATE','PLUGIN'].includes(result.type) ? result.type : fallback.type,
            tags: Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : fallback.tags,
            price: 0,
            github_url: repoData.html_url,
            readme: readme.substring(0, 5000),
          }
        } catch {
          throw new Error("Failed to parse JSON from AI response")
        }
      }
    )

    if (aiResult.error) {
      return NextResponse.json(
        {
          error: aiResult.error,
          credits: {
            reserved: aiResult.creditsReserved,
            charged: aiResult.creditsCharged,
            refunded: aiResult.creditsRefunded,
            balance: aiResult.availableBalance,
          },
        },
        { status: aiResult.error.includes("Insufficient credits") ? 402 : 500 }
      )
    }

    if (!aiResult.result) return NextResponse.json(fallback)

    return NextResponse.json({
      ...aiResult.result,
      credits: {
        reserved: aiResult.creditsReserved,
        charged: aiResult.creditsCharged,
        refunded: aiResult.creditsRefunded,
        balance: aiResult.availableBalance,
      },
    })

  } catch (error) {
    console.error('scan-repo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
