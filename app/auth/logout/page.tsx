'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ))

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    }
    logout()
  }, [supabase, router])

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <p>Logging out...</p>
    </div>
  )
}
