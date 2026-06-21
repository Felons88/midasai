import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-12b-it:free',
]

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

  const tags: string[] = [...topics, ...keywords, ...(lang ? [lang] : []), 'open-source']
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10)

  return {
    title: name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    description: repoData.description || packageJson?.description || `A ${repoData.language || 'code'} project: ${name}`,
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

    const prompt = `You are generating a marketplace listing for an AI tools marketplace. Reply with ONLY a JSON object, no markdown.

Repo: ${repoData.full_name}
Language: ${repoData.language || 'Unknown'}
Description: ${repoData.description || packageJson?.description || 'None'}
Topics: ${(repoData.topics || []).join(', ') || 'None'}
Deps: ${Object.keys(packageJson?.dependencies || {}).slice(0, 15).join(', ') || 'None'}
README: ${readme.substring(0, 1500)}

Return JSON: {"title":"...","description":"...","type":"SKILL|WORKFLOW|TEMPLATE|PLUGIN","tags":["..."],"price":0,"github_url":"${repoData.html_url}"}`

    const aiText = await tryOpenRouter(openrouterKey, prompt)

    if (!aiText) return NextResponse.json(fallback)

    const match = aiText.match(/\{[\s\S]*?\}(?=\s*$|\s*```)/)?.[0] || aiText.match(/\{[\s\S]*\}/)?.[0]
    if (!match) return NextResponse.json(fallback)

    try {
      const result = JSON.parse(match)
      return NextResponse.json({
        title: result.title || fallback.title,
        description: result.description || fallback.description,
        type: ['SKILL','WORKFLOW','TEMPLATE','PLUGIN'].includes(result.type) ? result.type : fallback.type,
        tags: Array.isArray(result.tags) && result.tags.length > 0 ? result.tags : fallback.tags,
        price: 0,
        github_url: repoData.html_url,
        readme: readme.substring(0, 5000),
      })
    } catch {
      return NextResponse.json(fallback)
    }

  } catch (error) {
    console.error('scan-repo error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
