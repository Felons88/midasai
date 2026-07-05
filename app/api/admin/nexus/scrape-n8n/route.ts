import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { scrapeAllN8nTemplates, scrapeN8nCategory } from '@/lib/nexus/n8n-scraper'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'OWNER')) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { category, mode = 'full' } = body

    // Progress callback that stores progress in a temporary table or returns via SSE
    // For now, we'll do simple synchronous processing with progress tracking
    
    if (mode === 'category' && category) {
      // Scrape a single category - scrapeN8nCategory already saves to nexus_workflow_templates
      const { workflows, errors } = await scrapeN8nCategory(
        category,
        (current, total, message) => {
          console.log(`[${current}/${total}] ${message}`)
        }
      )

      return NextResponse.json({
        success: true,
        imported: workflows.length,
        failed: errors.length,
        errors,
        total: workflows.length,
      })
    } else {
      // Full scrape - process all categories and save to nexus_workflow_templates
      const result = await scrapeAllN8nTemplates(
        (current, total, message) => {
          console.log(`[${current}/${total}] ${message}`)
        }
      )

      return NextResponse.json({
        success: result.failed === 0,
        imported: result.imported,
        failed: result.failed,
        categories: result.categories,
        errors: result.errors,
        message: 'Full scrape completed. Workflows saved to nexus_workflow_templates.',
      })
    }
  } catch (error) {
    console.error('Error in n8n scrape endpoint:', error)
    return NextResponse.json({ 
      error: 'Failed to scrape n8n workflows',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check available categories
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'OWNER')) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  try {
    // Fetch available categories from GitHub
    const response = await fetch('https://api.github.com/repos/zie619/n8n-workflows/contents/workflows', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const contents = await response.json()
    const categories = contents
      .filter((c: any) => c.type === 'dir')
      .map((c: any) => ({
        name: c.name,
        path: c.path,
      }))

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
