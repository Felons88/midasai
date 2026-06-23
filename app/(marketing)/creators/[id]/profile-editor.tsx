'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface ProfileEditorProps {
  userId: string
  initial: {
    bio: string
    website: string
    github_username: string
    twitter_username: string
    linkedin_url: string
    discord_url: string
  }
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-smooth'

export function ProfileEditor({ userId, initial }: ProfileEditorProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initial)

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="cursor-pointer">
        <Pencil className="h-4 w-4 mr-2" />Edit profile
      </Button>
    )
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const supabase = createBrowserSupabaseClient()
      const { error: upErr } = await supabase
        .from('users')
        .update({
          bio: form.bio.trim() || null,
          website: form.website.trim() || null,
          github_username: form.github_username.trim() || null,
          twitter_username: form.twitter_username.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          discord_url: form.discord_url.trim() || null,
        })
        .eq('id', userId)
      if (upErr) throw new Error(upErr.message)
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full mt-4 rounded-xl border border-white/10 bg-surface/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">Edit your profile</h3>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-text-tertiary hover:text-text-primary cursor-pointer"><X className="h-4 w-4" /></button>
      </div>
      <div>
        <label className="block text-sm text-text-tertiary mb-1">Bio</label>
        <textarea value={form.bio} onChange={set('bio')} rows={3} placeholder="Tell the community about yourself…" className={`${inputClass} resize-y`} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="block text-sm text-text-tertiary mb-1">Website</label><input value={form.website} onChange={set('website')} placeholder="https://example.com" className={inputClass} /></div>
        <div><label className="block text-sm text-text-tertiary mb-1">GitHub username</label><input value={form.github_username} onChange={set('github_username')} placeholder="octocat" className={inputClass} /></div>
        <div><label className="block text-sm text-text-tertiary mb-1">X / Twitter username</label><input value={form.twitter_username} onChange={set('twitter_username')} placeholder="handle" className={inputClass} /></div>
        <div><label className="block text-sm text-text-tertiary mb-1">LinkedIn URL</label><input value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/…" className={inputClass} /></div>
        <div><label className="block text-sm text-text-tertiary mb-1">Discord URL</label><input value={form.discord_url} onChange={set('discord_url')} placeholder="https://discord.gg/…" className={inputClass} /></div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} className="bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 cursor-pointer">{saving ? 'Saving…' : 'Save profile'}</Button>
        <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
      </div>
    </div>
  )
}
