import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { scrapeN8nCategory, scrapeN8nWorkflows } from '@/lib/nexus/n8n-scraper'

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

  if (!userData || userData.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { category, mode = 'full' } = body

    // Progress callback that stores progress in a temporary table or returns via SSE
    // For now, we'll do simple synchronous processing with progress tracking
    
    if (mode === 'category' && category) {
      // Scrape a single category
      const { workflows, errors } = await scrapeN8nCategory(
        category,
        (current, total, message) => {
          console.log(`[${current}/${total}] ${message}`)
        }
      )

      // Insert workflows into database
      let imported = 0
      let failed = 0

      for (const workflow of workflows) {
        try {
          const { error } = await supabase.from('nexus_workflows').insert({
            user_id: user.id,
            name: workflow.name,
            description: `Imported from n8n: ${category}/${workflow.name}`,
            definition: workflow.definition,
            status: 'draft',
            execution_count: 0,
            is_template: true,
            source_type: 'n8n',
            source_url: `https://github.com/zie619/n8n-workflows/tree/main/workflows/${category}`,
          })

          if (error) {
            console.error(`Failed to insert ${workflow.name}:`, error)
            failed++
          } else {
            imported++
          }
        } catch (error) {
          console.error(`Error inserting ${workflow.name}:`, error)
          failed++
        }
      }

      return NextResponse.json({
        success: true,
        imported,
        failed,
        errors,
        total: workflows.length,
      })
    } else {
      // Full scrape - this might take a long time, so we should return immediately
      // and process in the background. For now, we'll do it synchronously.
      
      const result = await scrapeN8nWorkflows(
        (current, total, message) => {
          console.log(`[${current}/${total}] ${message}`)
        }
      )

      // Note: The scraper doesn't actually return the workflows, just stats
      // We need to modify the scraper to return the workflows or do a different approach
      // For now, let's return the scrape result
      
      return NextResponse.json({
        success: result.success,
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
        warnings: result.warnings,
        message: 'Full scrape completed. Note: Workflows were not saved to database in this mode.',
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

  if (!userData || userData.role !== 'ADMIN') {
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
