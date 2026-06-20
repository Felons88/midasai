'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Shield, Bell, Key, Save } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [message, setMessage] = useState('')
  const [settings, setSettings] = useState({
    email_notifications: true,
    marketing_emails: false,
    theme: 'dark',
    language: 'en',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUser({ id: user.id, email: user.email || '' })

      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (userSettings) {
        setSettings({
          email_notifications: userSettings.email_notifications ?? true,
          marketing_emails: userSettings.marketing_emails ?? false,
          theme: userSettings.theme || 'dark',
          language: userSettings.language || 'en',
        })
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    if (!user) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        email_notifications: settings.email_notifications,
        marketing_emails: settings.marketing_emails,
        theme: settings.theme,
        language: settings.language,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      setMessage('Failed to save settings.')
    } else {
      setMessage('Settings saved successfully!')
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    })

    if (error) {
      setMessage('Failed to change password: ' + error.message)
    } else {
      setMessage('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative text-center">
          <p className="text-xl text-text-secondary">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative text-center">
          <Settings className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4 text-text-primary">Settings</h1>
          <p className="text-xl text-text-secondary mb-8">Sign in to manage your settings.</p>
          <Button asChild className="shadow-glow">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
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
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Settings</h1>
            <p className="text-xl text-text-secondary">Manage your account preferences</p>
          </div>

          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary flex items-center gap-2">
                  <Bell className="h-5 w-5 text-cta" /> Notifications
                </CardTitle>
                <CardDescription className="text-text-secondary">Control how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                  <div>
                    <p className="font-medium text-text-primary">Email Notifications</p>
                    <p className="text-sm text-text-tertiary">Receive email updates about your account activity</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, email_notifications: !settings.email_notifications })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.email_notifications ? 'bg-cta' : 'bg-surface border'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.email_notifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                  <div>
                    <p className="font-medium text-text-primary">Marketing Emails</p>
                    <p className="text-sm text-text-tertiary">Receive promotional emails and updates</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, marketing_emails: !settings.marketing_emails })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settings.marketing_emails ? 'bg-cta' : 'bg-surface border'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${settings.marketing_emails ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cta" /> Security
                </CardTitle>
                <CardDescription className="text-text-secondary">Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button onClick={handleChangePassword} variant="outline" disabled={saving}>
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cta" /> Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="flex h-10 w-full rounded-lg border bg-surface px-4 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {message && (
              <p className={`text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}

            <Button onClick={handleSaveSettings} disabled={saving} className="w-full h-12 shadow-glow">
              <Save className="mr-2 h-5 w-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>

            <Card className="glass border-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-text-secondary">Permanently delete your account and all associated data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">Delete Account</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
