'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle, ShieldCheck, Smartphone, LogOut, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SecurityPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createBrowserSupabaseClient()

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) setError(updateError.message)
    else {
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  const handleSignOutAll = async () => {
    if (!confirm('This will sign you out from all devices. Continue?')) return
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Security</h1>
        <p className="text-white/50 text-sm">Manage your password and security settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <Card className="border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-lg text-white">Change Password</CardTitle>
            </div>
            <CardDescription className="text-sm text-white/50">Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full h-10 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="mt-1.5 w-full h-10 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                  placeholder="Re-enter password"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && (
                <p className="text-sm text-amber-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> Password updated
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-lg text-white">Active Sessions</CardTitle>
            </div>
            <CardDescription className="text-sm text-white/50">Manage your active sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <div className="flex-1">
                <p className="text-sm text-white">Current session</p>
                <p className="text-[11px] text-white/30">Active now • This device</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOutAll}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out All Devices
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Tips */}
      <Card className="border border-amber-500/20 bg-amber-500/[0.02] mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-lg text-amber-400">Security Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-white/60">
            <li>• Use a strong password with at least 8 characters</li>
            <li>• Enable two-factor authentication when available</li>
            <li>• Don't share your password with anyone</li>
            <li>• Sign out from shared devices after use</li>
            <li>• Keep your software and browser updated</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
