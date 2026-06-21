"use client"

import { useState } from "react"
import { Settings, Mail, Megaphone, Loader2, CheckCircle, User } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface SettingsClientProps {
  initialSettings: {
    email_notifications: boolean
    marketing_emails: boolean
    theme: string
    language: string
  }
  user: {
    name: string
    email: string
  }
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-amber-500" : "bg-white/[0.1]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

export default function SettingsClient({ initialSettings, user }: SettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const supabase = createBrowserSupabaseClient()

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setError("Not authenticated")
        return
      }

      const { error: updateError } = await supabase
        .from("user_settings")
        .update({
          email_notifications: settings.email_notifications,
          marketing_emails: settings.marketing_emails,
          theme: settings.theme,
          language: settings.language,
        })
        .eq("user_id", authUser.id)

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      setError(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-white/50 text-sm">Manage your developer account preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {success && (
        <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Settings saved successfully!
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Account Info */}
      <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <User className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Account</h2>
            <p className="text-sm text-white/50">Your account information</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-white/30">Name</span>
            <p className="text-sm text-white mt-1">{user.name || "Not set"}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <span className="text-xs text-white/30">Email</span>
            <p className="text-sm text-white mt-1">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-white/40" />
              <div>
                <p className="text-sm text-white">Email Notifications</p>
                <p className="text-xs text-white/40">Receive important account and activity emails</p>
              </div>
            </div>
            <Toggle
              enabled={settings.email_notifications}
              onChange={() => setSettings({ ...settings, email_notifications: !settings.email_notifications })}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Megaphone className="h-4 w-4 text-white/40" />
              <div>
                <p className="text-sm text-white">Marketing Emails</p>
                <p className="text-xs text-white/40">Receive product updates and promotional content</p>
              </div>
            </div>
            <Toggle
              enabled={settings.marketing_emails}
              onChange={() => setSettings({ ...settings, marketing_emails: !settings.marketing_emails })}
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/30 mb-2 block">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/30 mb-2 block">Language</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
