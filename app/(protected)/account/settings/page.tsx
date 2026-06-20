'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

export default function AccountSettingsPage() {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)

  const handleDeleteAccount = async () => {
    if (!confirm('This will permanently delete your account and all data. Are you absolutely sure?')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
        <p className="text-white/50 text-sm">Account preferences and configuration</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Notification Preferences</h2>
          <div className="space-y-3">
            {[
              { label: 'Email notifications', desc: 'Receive updates about your purchases' },
              { label: 'Marketing emails', desc: 'Receive news about new features and listings' },
              { label: 'Creator updates', desc: 'Get notified when creators you follow post' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-[11px] text-white/30">{item.desc}</p>
                </div>
                <div className="h-5 w-9 rounded-full bg-amber-500/20 relative cursor-pointer">
                  <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-amber-400 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
          </div>
          <p className="text-sm text-white/40 mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="h-9 px-4 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
