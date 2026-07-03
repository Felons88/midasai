"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function NavbarSessionActions() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createBrowserSupabaseClient())

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-16 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-9 w-24 rounded-lg bg-white/5 animate-pulse" />
      </div>
    )
  }

  if (user) {
    return (
      <Button
        variant="ghost"
        asChild
        className="text-text-secondary hover:text-text-primary transition-smooth"
      >
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        asChild
        className="text-text-secondary hover:text-text-primary transition-smooth"
      >
        <Link href="/auth/login">Log in</Link>
      </Button>
      <Button asChild className="shadow-glow">
        <Link href="/auth/register">Sign up</Link>
      </Button>
    </>
  )
}
