'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const [supabase] = useState(() => createBrowserSupabaseClient())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/auth/login'), 2000)
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md glass">
        <CardHeader>
          <CardTitle className="text-2xl">Set new password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <p className="text-text-secondary text-center py-4">
              Password updated. Redirecting to login…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && <p className="text-sm text-accent-red">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-text-tertiary">
            <Link href="/auth/login" className="text-cta hover:underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
