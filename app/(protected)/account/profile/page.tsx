'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle, User, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AccountProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createBrowserSupabaseClient()

  const [form, setForm] = useState({
    name: '',
    email: '',
    bio: '',
    avatar_url: '',
    website: '',
    github: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setForm(prev => ({ ...prev, email: user.email || '' }))

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm({
          name: profile.name || '',
          email: profile.email || user.email || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || '',
          website: profile.website || '',
          github: profile.github || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: form.name,
        bio: form.bio,
        avatar_url: form.avatar_url,
        website: form.website,
        github: form.github,
      })
      .eq('id', user.id)

    if (updateError) setError(updateError.message)
    else { setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Profile</h1>
        <p className="text-white/50 text-sm">Manage your public profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Preview Card */}
        <Card className="border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Profile Preview</CardTitle>
            <CardDescription className="text-sm text-white/50">How others see your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-white/[0.04] flex items-center justify-center overflow-hidden">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-white/20" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">{form.name || 'Your Name'}</h3>
              <p className="text-sm text-white/40 mb-4">{form.email}</p>
              {form.bio && (
                <p className="text-sm text-white/60 mb-4 line-clamp-3">{form.bio}</p>
              )}
              <div className="flex justify-center gap-2">
                {form.website && (
                  <a href={form.website} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:text-amber-300">
                    Website
                  </a>
                )}
                {form.github && (
                  <a href={`https://github.com/${form.github}`} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:text-amber-300">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="border border-white/[0.06] bg-white/[0.02] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-white">Edit Profile</CardTitle>
            <CardDescription className="text-sm text-white/50">Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full h-10 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Email</label>
                  <input
                    value={form.email}
                    disabled
                    className="mt-1.5 w-full h-10 px-4 rounded-lg border border-white/[0.06] bg-white/[0.01] text-sm text-white/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    className="mt-1.5 w-full min-h-[100px] px-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50 resize-none"
                    placeholder="Tell people about yourself"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Avatar URL</label>
                  <input
                    name="avatar_url"
                    value={form.avatar_url}
                    onChange={e => setForm({ ...form, avatar_url: e.target.value })}
                    className="mt-1.5 w-full h-10 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Website</label>
                  <input
                    name="website"
                    value={form.website}
                    onChange={e => setForm({ ...form, website: e.target.value })}
                    className="mt-1.5 w-full h-10 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    placeholder="https://yoursite.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">GitHub</label>
                  <input
                    name="github"
                    value={form.github}
                    onChange={e => setForm({ ...form, github: e.target.value })}
                    className="mt-1.5 w-full h-10 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    placeholder="username"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && (
                <p className="text-sm text-amber-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> Profile saved
                </p>
              )}

              <Button
                type="submit"
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
