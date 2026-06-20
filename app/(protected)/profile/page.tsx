'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle } from "lucide-react"

export default function ProfilePage() {
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
  })

  useEffect(() => {
    async function loadProfile() {
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
        })
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
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
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Profile</h1>
            <p className="text-xl text-text-secondary">Manage your personal information</p>
          </div>

          <form onSubmit={handleSave}>
            <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Personal Information</CardTitle>
                <CardDescription className="text-text-secondary">Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-text-secondary">Name</Label>
                  <Input id="name" name="name" value={form.name} onChange={handleChange} className="mt-1" placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-text-secondary">Email</Label>
                  <Input id="email" type="email" value={form.email} className="mt-1" disabled />
                </div>
                <div>
                  <Label htmlFor="bio" className="text-text-secondary">Bio</Label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself"
                    className="mt-1 flex min-h-[80px] w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary ring-offset-background placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/50 transition-smooth"
                  />
                </div>
                <div>
                  <Label htmlFor="avatar_url" className="text-text-secondary">Avatar URL</Label>
                  <Input id="avatar_url" name="avatar_url" value={form.avatar_url} onChange={handleChange} placeholder="https://example.com/avatar.jpg" className="mt-1" />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-cta/10 border border-cta/20 rounded-xl text-cta text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Profile saved successfully!
                  </div>
                )}

                <Button type="submit" className="shadow-glow" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
