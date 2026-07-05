import { NextResponse } from 'next/server'
import { loadCustomNodes } from '@/lib/nexus/custom-nodes'

export async function GET() {
  try {
    const nodes = await loadCustomNodes()
    return NextResponse.json({ nodes })
  } catch (error) {
    console.error('Error loading custom nodes:', error)
    return NextResponse.json({
      error: 'Failed to load custom nodes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
