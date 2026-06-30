'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle, Camera, Github, Globe, User, AlertCircle } from "lucide-react"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createBrowserSupabaseClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    bio: '',
    avatar_url: '',
    github_url: '',
    website_url: '',
  })

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      setForm({
        name: profile?.name || user.user_metadata?.name || '',
        email: profile?.email || user.email || '',
        bio: profile?.bio || '',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        github_url: profile?.github_url || '',
        website_url: profile?.website_url || '',
      })
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setForm(prev => ({ ...prev, avatar_url: data.url }))
    } catch (err: any) {
      setError(err.message || 'Avatar upload failed.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: form.name,
          bio: form.bio,
          avatar_url: form.avatar_url,
          github_url: form.github_url,
          website_url: form.website_url,
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Profile</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your personal information and public presence</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Avatar section */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center">
                  {form.avatar_url
                    ? <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    : <User className="w-8 h-8 text-zinc-600" />
                  }
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-lg"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                >
                  {avatarUploading
                    ? <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                    : <Camera className="w-3.5 h-3.5 text-black" />
                  }
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{form.name || 'Your Name'}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{form.email}</div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {avatarUploading ? 'Uploading...' : 'Change photo'}
                </button>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">Personal Information</h2>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Display Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Email</label>
              <input
                value={form.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-zinc-600 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell the community about yourself..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Social links */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">Social Links</h2>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" /> GitHub
              </label>
              <input
                name="github_url"
                value={form.github_url}
                onChange={handleChange}
                placeholder="https://github.com/username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Website
              </label>
              <input
                name="website_url"
                value={form.website_url}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-green-500/8 border border-green-500/20 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Profile saved successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: saving ? "rgba(245,158,11,0.5)" : "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
