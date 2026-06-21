import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { upgradeToCreator } from '@/lib/roles'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Upgrade user to creator role
    const success = await upgradeToCreator(user.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to upgrade role' }, { status: 500 })
    }

    return NextResponse.json({ success: true, role: 'CREATOR' })
  } catch (error) {
    console.error('Error upgrading role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
