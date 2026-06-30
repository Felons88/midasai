'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      setPasswordLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      setPasswordLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setPasswordError(error.message)
      } else {
        setPasswordSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(false), 3000)
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cta" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Settings</h1>
            <p className="text-xl text-text-secondary">Manage your account settings</p>
          </div>

          <Card className="glass mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Account</CardTitle>
              <CardDescription className="text-text-secondary">Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-text-secondary">Email</Label>
                <Input id="email" type="email" value={email} className="mt-1" disabled />
              </div>
              <p className="text-sm text-text-tertiary">Contact support to change your email address.</p>
            </CardContent>
          </Card>

          <form onSubmit={handlePasswordChange}>
            <Card className="glass mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Change Password</CardTitle>
                <CardDescription className="text-text-secondary">Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword" className="text-text-secondary">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="mt-1" 
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-text-secondary">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="mt-1" 
                    placeholder="Re-enter your password"
                  />
                </div>

                {passwordError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-cta/10 border border-cta/20 rounded-xl text-cta text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Password updated successfully!
                  </div>
                )}

                <Button type="submit" className="shadow-glow" disabled={passwordLoading}>
                  {passwordLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </form>

          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-text-secondary">Permanently delete your account</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-tertiary mb-4">
                Once you delete your account, there is no going back. All your data, listings, and history will be permanently removed.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
