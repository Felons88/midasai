"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  Github,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard"
import { uploadListingPhotos } from "@/lib/listings/upload-photos"

type WizardStep = "thumbnail" | "basic" | "classification" | "repository" | "installation" | "seo" | "preview" | "publish"

interface CreateSkillWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateSkillWizard({ isOpen, onClose, onSuccess }: CreateSkillWizardProps) {
  const [step, setStep] = useState<WizardStep>("thumbnail")
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    seo_title: "",
    short_description: "",
    description: "",
    category: "",
    subcategory: "",
    tags: [] as string[],
    platforms: [] as string[],
    version: "",
    license: "",
    github_url: "",
    demo_url: "",
    documentation_url: "",
    website: "",
    discord: "",
    social_links: [] as string[],
    installation_command: "",
    requirements: "",
    environment_variables: "",
    dependencies: "",
    os_compatibility: [] as string[],
    install_time: "",
    difficulty: "",
    keywords: [] as string[],
    aliases: [] as string[],
  })

  const handleThumbnailUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, JPEG, WEBP)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }
    setThumbnail(file)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => setThumbnailPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addTag = (tag: string) => {
    if (!tag.trim() || formData.tags.includes(tag.trim())) return
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag.trim()] }))
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const validateStep = (currentStep: WizardStep): boolean => {
    switch (currentStep) {
      case "thumbnail":
        return thumbnail !== null
      case "basic":
        return formData.title.trim() !== "" && formData.short_description.trim() !== "" && formData.category !== ""
      case "repository":
        return formData.github_url.trim() !== ""
      case "installation":
        return formData.installation_command.trim() !== ""
      case "seo":
        return true
      case "preview":
        return true
      case "publish":
        return (
          thumbnail !== null &&
          formData.title.trim() !== "" &&
          formData.short_description.trim() !== "" &&
          formData.github_url.trim() !== "" &&
          formData.category !== "" &&
          formData.installation_command.trim() !== "" &&
          formData.tags.length > 0
        )
      default:
        return true
    }
  }

  const nextStep = () => {
    if (!validateStep(step)) {
      setError("Please fill in all required fields")
      return
    }
    setError(null)
    const steps: WizardStep[] = ["thumbnail", "basic", "classification", "repository", "installation", "seo", "preview", "publish"]
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: WizardStep[] = ["thumbnail", "basic", "classification", "repository", "installation", "seo", "preview", "publish"]
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const handlePublish = async () => {
    if (!validateStep("publish")) {
      setError("Please fill in all required fields")
      return
    }
    setIsPublishing(true)
    setError(null)
    try {
      const payload = {
        title: formData.title.trim(),
        seo_title: formData.seo_title.trim() || formData.title.trim(),
        description: formData.description.trim() || formData.short_description.trim(),
        short_description: formData.short_description.trim(),
        type: "SKILL",
        category_slug: formData.category,
        tags: Array.from(new Set([...formData.tags, formData.category, formData.subcategory].filter(Boolean))),
        github_url: formData.github_url.trim(),
        readme: formData.description.trim() || null,
        topics: Array.from(new Set([...formData.keywords, ...formData.aliases])),
        license: formData.license || null,
        scanResult: {
          installation_steps: formData.installation_command
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        },
      }

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to publish listing")
      }

      const listingId = data.listing?.id as string | undefined
      if (listingId && thumbnail) {
        const { error: photoError } = await uploadListingPhotos(listingId, [thumbnail])
        if (photoError) {
          throw new Error(photoError)
        }
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish. Please try again.")
    } finally {
      setIsPublishing(false)
    }
  }

  const stepTitles: Record<WizardStep, string> = {
    thumbnail: "Upload Thumbnail",
    basic: "Basic Information",
    classification: "Category & Platforms",
    repository: "Repository",
    installation: "Installation",
    seo: "Search Optimization",
    preview: "Preview",
    publish: "Publish",
  }

  const steps: WizardStep[] = ["thumbnail", "basic", "classification", "repository", "installation", "seo", "preview", "publish"]
  const currentStepIndex = steps.indexOf(step)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Create Skill</CardTitle>
              <CardDescription>Step {currentStepIndex + 1} of {steps.length}: {stepTitles[step]}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            {steps.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-smooth",
                  i <= currentStepIndex ? "bg-cta" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {step === "thumbnail" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-4">
                  {thumbnailPreview ? (
                    <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-lg overflow-hidden bg-surface">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                        onClick={() => {
                          setThumbnail(null)
                          setThumbnailPreview(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto aspect-video rounded-lg border-2 border-dashed border-white/20 hover:border-cta/50 transition-smooth cursor-pointer bg-surface">
                      <Upload className="h-12 w-12 text-text-tertiary mb-2" />
                      <span className="text-text-secondary">Click to upload thumbnail</span>
                      <span className="text-xs text-text-tertiary mt-1">PNG, JPG, JPEG, WEBP (max 5MB)</span>
                      <span className="text-xs text-text-tertiary">Recommended: 1200x630 (16:9)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-text-tertiary">
                  This image will be displayed as the marketplace thumbnail. Only one image is allowed.
                </p>
              </div>
            </div>
          )}

          {step === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Skill Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Claude Memory"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Short Description <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.short_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Brief description (max 250 characters)"
                  maxLength={250}
                />
                <p className="text-xs text-text-tertiary mt-1">{formData.short_description.length}/250</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Full Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of your skill..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai-agents">AI Agents</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="web-scraping">Web Scraping</SelectItem>
                      <SelectItem value="databases">Databases</SelectItem>
                      <SelectItem value="devops">DevOps</SelectItem>
                      <SelectItem value="image-generation">Image Generation</SelectItem>
                      <SelectItem value="video-creation">Video Creation</SelectItem>
                      <SelectItem value="voice">Voice</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tags
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag((e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "repository" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  GitHub URL <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <Github className="h-5 w-5 text-text-tertiary mt-2.5" />
                  <Input
                    value={formData.github_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Demo URL (optional)
                </label>
                <div className="flex gap-2">
                  <ExternalLink className="h-5 w-5 text-text-tertiary mt-2.5" />
                  <Input
                    value={formData.demo_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, demo_url: e.target.value }))}
                    placeholder="https://demo.example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Documentation URL (optional)
                </label>
                <Input
                  value={formData.documentation_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, documentation_url: e.target.value }))}
                  placeholder="https://docs.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Website (optional)
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Discord (optional)
                </label>
                <Input
                  value={formData.discord}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discord: e.target.value }))}
                  placeholder="https://discord.gg/..."
                />
              </div>
            </div>
          )}

          {step === "classification" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Subcategory
                </label>
                <Input
                  value={formData.subcategory}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subcategory: e.target.value }))}
                  placeholder="e.g., Browser Automation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Supported Platforms (comma-separated)
                </label>
                <Input
                  value={formData.platforms.join(", ")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      platforms: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="Claude, Cursor, MCP, API"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Version
                  </label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData((prev) => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g., 1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    License
                  </label>
                  <Select value={formData.license} onValueChange={(value) => setFormData((prev) => ({ ...prev, license: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select license" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MIT">MIT</SelectItem>
                      <SelectItem value="Apache-2.0">Apache 2.0</SelectItem>
                      <SelectItem value="GPL-3.0">GPL 3.0</SelectItem>
                      <SelectItem value="BSD-3-Clause">BSD 3-Clause</SelectItem>
                      <SelectItem value="proprietary">Proprietary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === "installation" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Installation Command <span className="text-red-400">*</span>
                </label>
                <Textarea
                  value={formData.installation_command}
                  onChange={(e) => setFormData((prev) => ({ ...prev, installation_command: e.target.value }))}
                  placeholder="e.g., npm install @package/name"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Requirements
                </label>
                <Textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                  placeholder="e.g., Node.js 18+, Python 3.10+"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Environment Variables
                </label>
                <Textarea
                  value={formData.environment_variables}
                  onChange={(e) => setFormData((prev) => ({ ...prev, environment_variables: e.target.value }))}
                  placeholder="e.g., API_KEY=your_key"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Dependencies
                </label>
                <Textarea
                  value={formData.dependencies}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dependencies: e.target.value }))}
                  placeholder="e.g., @supabase/supabase-js, next"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Install Time
                  </label>
                  <Select value={formData.install_time} onValueChange={(value) => setFormData((prev) => ({ ...prev, install_time: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<1min">&lt; 1 minute</SelectItem>
                      <SelectItem value="1-5min">1-5 minutes</SelectItem>
                      <SelectItem value="5-10min">5-10 minutes</SelectItem>
                      <SelectItem value="10-30min">10-30 minutes</SelectItem>
                      <SelectItem value="30min+">30+ minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Difficulty
                  </label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData((prev) => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === "seo" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-cta" />
                <h3 className="text-lg font-semibold text-text-primary">Auto-Generated SEO</h3>
              </div>
              <p className="text-sm text-text-secondary">
                We've automatically generated keywords, aliases, and search tags based on your skill information. You can edit these if needed.
              </p>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Keywords
                </label>
                <Input
                  value={formData.keywords.join(", ")}
                  onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value.split(", ").filter(Boolean) }))}
                  placeholder="Comma-separated keywords"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Aliases
                </label>
                <Input
                  value={formData.aliases.join(", ")}
                  onChange={(e) => setFormData((prev) => ({ ...prev, aliases: e.target.value.split(", ").filter(Boolean) }))}
                  placeholder="Comma-separated aliases"
                />
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-cta" />
                <h3 className="text-lg font-semibold text-text-primary">Preview Your Skill Card</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </div>
                  <div className="transform scale-100">
                    <MarketplaceCard
                      listing={{
                        id: "preview",
                        title: formData.title,
                        seo_title: formData.seo_title,
                        description: formData.description,
                        short_description: formData.short_description,
                        type: "SKILL",
                        price: 0,
                        downloads: 0,
                        views: 0,
                        average_rating: 0,
                        review_count: 0,
                        images: thumbnailPreview ? [thumbnailPreview] : [],
                        tags: formData.tags,
                        updated_at: new Date(),
                        creator: { name: "Your Name", avatar_url: null, verified: false },
                        featured: false,
                        verified: false,
                      }}
                      index={0}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <Tablet className="h-4 w-4" />
                    Tablet
                  </div>
                  <div className="transform scale-75 origin-top">
                    <MarketplaceCard
                      listing={{
                        id: "preview",
                        title: formData.title,
                        seo_title: formData.seo_title,
                        description: formData.description,
                        short_description: formData.short_description,
                        type: "SKILL",
                        price: 0,
                        downloads: 0,
                        views: 0,
                        average_rating: 0,
                        review_count: 0,
                        images: thumbnailPreview ? [thumbnailPreview] : [],
                        tags: formData.tags,
                        updated_at: new Date(),
                        creator: { name: "Your Name", avatar_url: null, verified: false },
                        featured: false,
                        verified: false,
                      }}
                      index={0}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-tertiary">
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </div>
                  <div className="transform scale-50 origin-top">
                    <MarketplaceCard
                      listing={{
                        id: "preview",
                        title: formData.title,
                        seo_title: formData.seo_title,
                        description: formData.description,
                        short_description: formData.short_description,
                        type: "SKILL",
                        price: 0,
                        downloads: 0,
                        views: 0,
                        average_rating: 0,
                        review_count: 0,
                        images: thumbnailPreview ? [thumbnailPreview] : [],
                        tags: formData.tags,
                        updated_at: new Date(),
                        creator: { name: "Your Name", avatar_url: null, verified: false },
                        featured: false,
                        verified: false,
                      }}
                      index={0}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "publish" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-text-primary">Ready to Publish</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className={cn("h-5 w-5", thumbnail ? "text-emerald-400" : "text-text-tertiary")} />
                  <span className={cn("text-sm", thumbnail ? "text-text-primary" : "text-text-tertiary")}>
                    Thumbnail uploaded
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className={cn("h-5 w-5", formData.title ? "text-emerald-400" : "text-text-tertiary")} />
                  <span className={cn("text-sm", formData.title ? "text-text-primary" : "text-text-tertiary")}>
                    Skill name provided
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className={cn("h-5 w-5", formData.short_description ? "text-emerald-400" : "text-text-tertiary")} />
                  <span className={cn("text-sm", formData.short_description ? "text-text-primary" : "text-text-tertiary")}>
                    Short description provided
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className={cn("h-5 w-5", formData.github_url ? "text-emerald-400" : "text-text-tertiary")} />
                  <span className={cn("text-sm", formData.github_url ? "text-text-primary" : "text-text-tertiary")}>
                    GitHub URL provided
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className={cn("h-5 w-5", formData.category ? "text-emerald-400" : "text-text-tertiary")} />
                  <span className={cn("text-sm", formData.category ? "text-text-primary" : "text-text-tertiary")}>
                    Category selected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className={cn("h-5 w-5", formData.installation_command ? "text-emerald-400" : "text-text-tertiary")} />
                  <span className={cn("text-sm", formData.installation_command ? "text-text-primary" : "text-text-tertiary")}>
                    Installation command provided
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className={cn("h-5 w-5", formData.tags.length > 0 ? "text-emerald-400" : "text-text-tertiary")} />
                  <span className={cn("text-sm", formData.tags.length > 0 ? "text-text-primary" : "text-text-tertiary")}>
                    Tags added ({formData.tags.length})
                  </span>
                </div>
              </div>
              {!validateStep("publish") && (
                <p className="text-sm text-red-400 mt-4">
                  Please complete all required fields before publishing.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={prevStep} disabled={currentStepIndex === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {step === "publish" ? (
              <Button onClick={handlePublish} disabled={!validateStep("publish") || isPublishing}>
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish Skill
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
