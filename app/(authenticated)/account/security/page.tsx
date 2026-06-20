'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle, ShieldCheck } from "lucide-react"

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
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
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

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Security</h1>
        <p className="text-white/50 text-sm">Manage your password and security settings</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-6">
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="mt-1.5 w-full h-10 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                placeholder="At least 6 characters"
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

            <button
              type="submit"
              disabled={loading}
              className="h-10 px-6 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </form>

      {/* Sessions */}
      <div className="mt-6 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-white mb-4">Active Sessions</h2>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06]">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <div>
            <p className="text-sm text-white">Current session</p>
            <p className="text-[11px] text-white/30">Active now</p>
          </div>
        </div>
      </div>
    </div>
  )
}
