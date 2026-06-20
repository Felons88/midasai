'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Upload, FolderOpen, Sparkles, ArrowRight, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type AnalysisResult = {
  title: string
  description: string
  type: string
  category: string
  tags: string[]
  technologies: string[]
  qualityScore: number
}

export default function CreatorUploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<'source' | 'details' | 'success'>('source')
  const [analyzing, setAnalyzing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [listing, setListing] = useState({
    title: '',
    description: '',
    type: 'SKILL' as string,
    price: 0,
    tags: '',
  })

  const handleAnalyzeGithub = async () => {
    if (!githubUrl) return
    setAnalyzing(true)
    setError('')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'github', url: githubUrl }),
      })

      const data = await response.json()
      if (data.success && data.analysis) {
        setAnalysis(data.analysis)
        setListing({
          title: data.analysis.title,
          description: data.analysis.description,
          type: data.analysis.type || 'SKILL',
          price: 0,
          tags: data.analysis.tags?.join(', ') || '',
        })
        setStep('details')
      } else {
        setError('Failed to analyze repository. Please check the URL.')
      }
    } catch {
      setError('Failed to analyze repository.')
    }
    setAnalyzing(false)
  }

  const handleSkipAnalysis = () => {
    setStep('details')
  }

  const handleSubmitListing = async () => {
    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in to create a listing.')
      setSubmitting(false)
      return
    }

    if (!listing.title || !listing.description) {
      setError('Title and description are required.')
      setSubmitting(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('listings')
      .insert({
        title: listing.title,
        description: listing.description,
        type: listing.type,
        price: listing.price,
        creator_id: user.id,
        status: 'PENDING',
      })
      .select()
      .single()

    if (insertError) {
      setError('Failed to create listing: ' + insertError.message)
      setSubmitting(false)
      return
    }

    setStep('success')
    setSubmitting(false)
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="noise-overlay" />
        <div className="container mx-auto px-4 py-24 relative text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-text-primary">Listing Created!</h1>
          <p className="text-xl text-text-secondary mb-8">Your listing has been submitted for review and will be published after approval.</p>
          <div className="flex gap-4 justify-center">
            <Button asChild className="shadow-glow">
              <Link href="/creator/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={() => { setStep('source'); setListing({ title: '', description: '', type: 'SKILL', price: 0, tags: '' }); setAnalysis(null); }}>
              Create Another
            </Button>
          </div>
        </div>
      </div>
    )
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

          <div className="flex items-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 'source' ? 'bg-cta/10 text-cta border border-cta/30' : 'bg-surface text-text-tertiary'}`}>
              1. Source
            </div>
            <ArrowRight className="h-4 w-4 text-text-tertiary" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 'details' ? 'bg-cta/10 text-cta border border-cta/30' : 'bg-surface text-text-tertiary'}`}>
              2. Details & Publish
            </div>
          </div>

          {step === 'source' && (
            <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-2xl text-text-primary">GitHub Repository</CardTitle>
                  <CardDescription className="text-text-secondary">Paste a GitHub URL to automatically analyze and import</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="github-url">Repository URL</Label>
                    <Input 
                      id="github-url" 
                      placeholder="https://github.com/username/repository"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                  </div>
                  <div className="p-4 bg-surface rounded-xl">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-cta mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-text-primary">AI-Powered Analysis</p>
                        <p className="text-xs text-text-tertiary">We&apos;ll analyze the repository and generate optimized listing metadata.</p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAnalyzeGithub} disabled={analyzing || !githubUrl} className="w-full transition-smooth">
                    <Github className="h-4 w-4 mr-2" />
                    {analyzing ? 'Analyzing...' : 'Analyze Repository'}
                  </Button>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-text-tertiary text-sm mb-4">Or create a listing manually</p>
                <Button variant="outline" onClick={handleSkipAnalysis}>
                  Skip Analysis & Create Manually
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 rounded-xl text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {analysis && (
                <Card className="glass border-cta/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-cta" />
                      <p className="text-sm text-text-primary">
                        AI analysis complete. Quality score: <span className="font-bold text-cta">{analysis.qualityScore}/100</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-2xl text-text-primary">Listing Details</CardTitle>
                  <CardDescription className="text-text-secondary">Review and edit your listing information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={listing.title}
                      onChange={(e) => setListing({ ...listing, title: e.target.value })}
                      placeholder="Enter listing title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[120px] w-full rounded-lg border bg-surface px-4 py-2 text-sm text-text-primary ring-offset-background placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                      value={listing.description}
                      onChange={(e) => setListing({ ...listing, description: e.target.value })}
                      placeholder="Describe your listing..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <select
                        id="type"
                        value={listing.type}
                        onChange={(e) => setListing({ ...listing, type: e.target.value })}
                        className="flex h-10 w-full rounded-lg border bg-surface px-4 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                      >
                        <option value="SKILL">Claude Skill</option>
                        <option value="PLUGIN">Cursor Rule</option>
                        <option value="MCP">MCP Server</option>
                        <option value="AGENT">AI Agent</option>
                        <option value="PROMPT">Prompt Pack</option>
                        <option value="WORKFLOW">Workflow</option>
                        <option value="TEMPLATE">Template</option>
                        <option value="AUTOMATION">Automation</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($) - 0 for Free</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={listing.price}
                        onChange={(e) => setListing({ ...listing, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={listing.tags}
                      onChange={(e) => setListing({ ...listing, tags: e.target.value })}
                      placeholder="ai, productivity, automation"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/10 rounded-xl text-red-400">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setStep('source')} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleSubmitListing} disabled={submitting} className="flex-1 shadow-glow">
                      <Upload className="h-4 w-4 mr-2" />
                      {submitting ? 'Creating...' : 'Create Listing'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
