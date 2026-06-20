'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    }
    logout()
  }, [router])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="container mx-auto px-4 py-24 relative text-center">
        <p className="text-xl text-text-secondary">Signing out...</p>
      </div>
    </div>
  )
}
