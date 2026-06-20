'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Upload, Sparkles, Loader2, CheckCircle } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function CreatorUploadPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    category: '',
    price: '',
    tags: '',
    github_url: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to create a listing.')
        setLoading(false)
        return
      }

      if (!form.title || !form.type || !form.price) {
        setError('Title, Type, and Price are required.')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('listings')
        .insert({
          title: form.title,
          description: form.description,
          type: form.type,
          price: parseFloat(form.price) || 0,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
          creator_id: user.id,
          status: 'ACTIVE',
          source_url: form.github_url || null,
        })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/creator/listings')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Upload Listing</h1>
            <p className="text-xl text-text-secondary">Create a new listing for the marketplace</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-2xl text-text-primary">Source (Optional)</CardTitle>
                  <CardDescription className="text-text-secondary">Link a GitHub repository</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="github_url" className="text-text-secondary">GitHub Repository URL</Label>
                    <Input 
                      id="github_url" 
                      name="github_url"
                      value={form.github_url}
                      onChange={handleChange}
                      placeholder="https://github.com/username/repository" 
                      className="mt-1"
                    />
                  </div>
                  <div className="p-4 bg-surface rounded-xl">
                    <div className="flex items-start gap-3">
                      <Github className="h-5 w-5 text-cta mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-text-primary">Link Your Repo</p>
                        <p className="text-xs text-text-tertiary">Adding a GitHub URL allows users to verify the source and check for updates.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-2xl text-text-primary">Listing Details</CardTitle>
                  <CardDescription className="text-text-secondary">Describe what you're selling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-text-secondary">Title *</Label>
                    <Input 
                      id="title" 
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="My Awesome AI Skill" 
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-text-secondary">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="mt-1 flex min-h-[120px] w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary ring-offset-background placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/50 transition-smooth"
                      placeholder="Describe your listing in detail..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type" className="text-text-secondary">Type *</Label>
                      <select
                        id="type"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="mt-1 flex h-10 w-full rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/50 transition-smooth"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="SKILL">Claude Skill</option>
                        <option value="CURSOR_RULE">Cursor Rule</option>
                        <option value="MCP_SERVER">MCP Server</option>
                        <option value="AGENT">AI Agent</option>
                        <option value="PROMPT_PACK">Prompt Pack</option>
                        <option value="WORKFLOW">Workflow</option>
                        <option value="TEMPLATE">Template</option>
                        <option value="PLUGIN">Plugin</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="price" className="text-text-secondary">Price ($) *</Label>
                      <Input 
                        id="price" 
                        name="price"
                        type="number" 
                        value={form.price}
                        onChange={handleChange}
                        placeholder="0" 
                        min="0" 
                        step="0.01"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tags" className="text-text-secondary">Tags (comma-separated)</Label>
                    <Input 
                      id="tags" 
                      name="tags"
                      value={form.tags}
                      onChange={handleChange}
                      placeholder="ai, automation, productivity" 
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-6 p-4 bg-cta/10 border border-cta/20 rounded-xl text-cta text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Listing created successfully! Redirecting...
              </div>
            )}

            <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Button 
                type="submit" 
                className="w-full h-14 text-lg shadow-glow transition-smooth" 
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating Listing...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Created!
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Create Listing
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
