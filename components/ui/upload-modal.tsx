"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  X, 
  Github, 
  Search, 
  Code, 
  FileText, 
  Zap, 
  Package, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Star,
  GitBranch,
  Clock
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Repository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  language: string
  stargazers_count: number
  forks_count: number
  updated_at: string
  topics: string[]
  license: string
  html_url: string
}

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [step, setStep] = useState<'github' | 'select' | 'scan' | 'review' | 'upload'>('github')
  const [isConnected, setIsConnected] = useState(false)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [scanResult, setScanResult] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'SKILL',
    tags: [] as string[],
    price: 0 as number,
    github_url: ''
  })

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      checkGitHubConnection()
    }
  }, [isOpen])

  const checkGitHubConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: connection } = await supabase
        .from('github_connections')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      setIsConnected(!!connection)
    } catch (error) {
      console.error('Error checking GitHub connection:', error)
    }
  }

  const connectGitHub = async () => {
    try {
      const response = await fetch('/api/github/auth', { cache: 'no-store' })
      if (!response.ok) throw new Error(`Auth request failed: ${response.status}`)
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      window.location.href = data.authUrl
    } catch (error) {
      console.error('Error connecting to GitHub:', error)
    }
  }

  const fetchRepositories = async () => {
    try {
      const response = await fetch('/api/github/repos')
      const data = await response.json()
      
      if (data.error) throw new Error(data.error)

      setRepositories(data.repositories || [])
      setStep('select')
    } catch (error) {
      console.error('Error fetching repositories:', error)
    }
  }

  const scanRepository = async (repo: Repository) => {
    setSelectedRepo(repo)
    setIsScanning(true)
    setStep('scan')

    try {
      const response = await fetch('/api/github/scan-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repo.full_name })
      })
      
      const data = await response.json()
      
      if (data.error) throw new Error(data.error)

      setScanResult(data)
      setFormData({
        title: data.title || '',
        description: data.description || '',
        type: (data.type || 'SKILL').toUpperCase(),
        tags: Array.isArray(data.tags) ? data.tags : [],
        price: typeof data.price === 'number' ? data.price : 0,
        github_url: data.github_url || ''
      })
      setStep('review')
    } catch (error) {
      console.error('Error scanning repository:', error)
      setStep('select')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSubmit = async () => {
    setIsUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const res = await fetch('/api/listings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          tags: Array.isArray(formData.tags) ? formData.tags : [],
          topics: Array.isArray(selectedRepo?.topics) ? selectedRepo.topics : [],
          price: typeof formData.price === 'number' ? formData.price : 0,
          github_url: formData.github_url || null,
          readme: scanResult?.readme || null,
          language: selectedRepo?.language || null,
          license: selectedRepo?.license || null,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create listing')

      setStep('upload')
      setTimeout(() => {
        onClose()
        onSuccess?.()
      }, 2000)
    } catch (error) {
      console.error('Error uploading:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SKILL': return <Zap className="h-4 w-4" />
      case 'WORKFLOW': return <Code className="h-4 w-4" />
      case 'TEMPLATE': return <FileText className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SKILL': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'WORKFLOW': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'TEMPLATE': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-[#0a0a0f] rounded-2xl border border-white/[0.08] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <h2 className="text-2xl font-bold text-white">Upload from GitHub</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/[0.1]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 'github' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <Github className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                {isConnected ? 'GitHub Connected' : 'Connect to GitHub'}
              </h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                {isConnected 
                  ? 'Your GitHub account is connected. Click below to select a repository to upload.'
                  : 'Connect your GitHub account to import your repositories and automatically generate upload details with AI.'
                }
              </p>
              <div className="flex items-center gap-4 justify-center">
                {isConnected ? (
                  <Button 
                    onClick={fetchRepositories}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Browse Repositories
                  </Button>
                ) : (
                  <Button 
                    onClick={connectGitHub}
                    className="bg-gray-700 hover:bg-gray-600"
                  >
                    <Github className="h-4 w-4 mr-2" />
                    Connect GitHub
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 'select' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Select a Repository</h3>
                <p className="text-white/60">Choose a repository to scan and upload to the marketplace</p>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {filteredRepositories.map((repo) => (
                  <Card 
                    key={repo.id} 
                    className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-all"
                    onClick={() => scanRepository(repo)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">{repo.name}</h4>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-400">
                                Private
                              </Badge>
                            )}
                          </div>
                          <p className="text-white/60 text-sm mb-3 line-clamp-2">
                            {repo.description || 'No description available'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-white/40">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {repo.stargazers_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {repo.forks_count}
                            </div>
                            {repo.language && (
                              <Badge variant="outline" className="text-xs border-white/[0.2]">
                                {repo.language}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-white/20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'scan' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {isScanning ? (
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                ) : (
                  <Zap className="h-10 w-10 text-white" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                {isScanning ? 'Scanning Repository' : 'AI Analysis Complete'}
              </h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                {isScanning 
                  ? 'Our AI is analyzing your repository to automatically generate the perfect listing details...'
                  : 'Repository analyzed successfully! Review the generated details below.'
                }
              </p>
              {isScanning && (
                <div className="w-64 mx-auto bg-white/[0.1] rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" style={{ width: '70%' }} />
                </div>
              )}
            </div>
          )}

          {step === 'review' && scanResult && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Review Generated Details</h3>
                <p className="text-white/60">AI-generated details for your repository. You can edit them before uploading.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-white/[0.05] border-white/[0.1] text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="bg-white/[0.05] border-white/[0.1] text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Type</label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="bg-white/[0.05] border-white/[0.1] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SKILL">Skill</SelectItem>
                        <SelectItem value="WORKFLOW">Workflow</SelectItem>
                        <SelectItem value="TEMPLATE">Template</SelectItem>
                        <SelectItem value="PLUGIN">Plugin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Price</label>
                    <Input
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="Free (GitHub projects)"
                      disabled
                      className="bg-white/[0.05] border-white/[0.1] text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-white/[0.1] text-white/80">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedRepo && (
                  <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`h-10 w-10 rounded-lg ${getTypeColor(formData.type)} border flex items-center justify-center`}>
                          {getTypeIcon(formData.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{selectedRepo.name}</h4>
                          <p className="text-sm text-white/60">{selectedRepo.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {selectedRepo.stargazers_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {selectedRepo.forks_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(selectedRepo.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep('select')}
                  className="border-white/[0.2] text-white hover:bg-white/[0.1]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload to Marketplace'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Upload Successful!</h3>
              <p className="text-white/60 mb-8">
                Your repository has been uploaded to the marketplace and is now under review.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
