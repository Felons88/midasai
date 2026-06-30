'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSafeRedirectPath } from '@/lib/auth/redirect'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const searchParams = useSearchParams()
  const [supabase] = useState(() => createBrowserSupabaseClient())

  const redirectParam = searchParams.get('redirect')
  const safeRedirect = getSafeRedirectPath(redirectParam)
  const loginHref = safeRedirect
    ? `/auth/login?redirect=${encodeURIComponent(safeRedirect)}`
    : '/auth/login'

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {sent
              ? 'Check your email for a password reset link.'
              : 'Enter your email and we will send you a reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                If an account exists for <span className="font-medium text-text-primary">{email}</span>, you will receive an email shortly.
              </p>
              <Button asChild className="w-full">
                <Link href={loginHref}>Back to login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
              <div className="text-center text-sm">
                Remember your password?{' '}
                <Link href={loginHref} className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
