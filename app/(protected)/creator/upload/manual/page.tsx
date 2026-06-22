'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

const LISTING_TYPES = ['SKILL', 'WORKFLOW', 'TEMPLATE', 'PLUGIN'] as const

const inputClass =
  'w-full px-4 py-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-smooth'

export default function ManualUploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<(typeof LISTING_TYPES)[number]>('SKILL')
  const [price, setPrice] = useState(0)
  const [tags, setTags] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [language, setLanguage] = useState('')
  const [license, setLicense] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/listings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          price: Number.isFinite(price) ? price : 0,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          github_url: githubUrl.trim() || null,
          language: language.trim() || null,
          license: license.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to create listing.')
        setLoading(false)
        return
      }

      router.push('/creator/listings')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link
          href="/creator/upload"
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-smooth"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Create Listing Manually</h1>
        <p className="text-white/60">
          Fill out the details below to publish your skill, workflow, template, or plugin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
            Title <span className="text-amber-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Code Review Assistant Skill"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
            Description <span className="text-amber-400">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what your creation does and who it's for"
            rows={5}
            className={`${inputClass} resize-y`}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-white mb-2">
              Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as (typeof LISTING_TYPES)[number])}
              className={inputClass}
            >
              {LISTING_TYPES.map((t) => (
                <option key={t} value={t} className="bg-surface text-white">
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-white mb-2">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            <p className="text-xs text-white/40 mt-1">Set to 0 to list for free.</p>
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-white mb-2">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma, separated, tags"
            className={inputClass}
          />
          <p className="text-xs text-white/40 mt-1">Separate tags with commas.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-white mb-2">
              Language <span className="text-white/40">(optional)</span>
            </label>
            <input
              id="language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g., TypeScript"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="license" className="block text-sm font-medium text-white mb-2">
              License <span className="text-white/40">(optional)</span>
            </label>
            <input
              id="license"
              type="text"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder="e.g., MIT"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="githubUrl" className="block text-sm font-medium text-white mb-2">
            GitHub URL <span className="text-white/40">(optional)</span>
          </label>
          <input
            id="githubUrl"
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/you/repo"
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !title.trim() || !description.trim()}
            className="bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            {loading ? 'Publishing…' : 'Publish Listing'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/creator/upload">Cancel</Link>
          </Button>
        </div>
        <p className="text-xs text-white/40">
          New listings are submitted with status <span className="text-white/70">PENDING</span> for review.
        </p>
      </form>
    </div>
  )
}
