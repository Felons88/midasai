'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Upload, Sparkles, Zap, Code, FileText, Package } from "lucide-react"
import { UploadModal } from "@/components/ui/upload-modal"
import { useRouter, useSearchParams } from "next/navigation"

export default function CreatorUploadPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if GitHub was just connected
    if (searchParams.get('github_connected') === 'true') {
      setGithubConnected(true)
      setIsModalOpen(true)
    }
  }, [searchParams])

  const handleUploadSuccess = () => {
    router.push('/creator/listings')
  }

  const uploadOptions = [
    {
      title: 'Upload from GitHub',
      description: 'Connect your GitHub account and let AI analyze your repository to automatically generate the perfect listing',
      icon: Github,
      color: 'from-gray-600 to-gray-800',
      action: () => setIsModalOpen(true),
      badge: 'AI-Powered'
    },
    {
      title: 'Manual Upload',
      description: 'Create a listing manually by filling out all the details yourself',
      icon: Upload,
      color: 'from-blue-500 to-purple-600',
      action: () => router.push('/creator/upload/manual'),
      badge: 'Available'
    }
  ]

  const features = [
    {
      icon: Zap,
      title: 'AI Analysis',
      description: 'Gemini AI analyzes your repository to generate titles, descriptions, and tags'
    },
    {
      icon: Code,
      title: 'Smart Detection',
      description: 'Automatically detects whether your project is a skill, workflow, template, or plugin'
    },
    {
      icon: Package,
      title: 'Auto-Filled Details',
      description: 'Repository information, topics, and license are automatically imported'
    },
    {
      icon: FileText,
      title: 'README Processing',
      description: 'Extracts key features and use cases from your README files'
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-blue-500/20 border border-white/[0.1] mb-6">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-white/80">AI-Powered Upload System</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">
              Upload Your Creation
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Share your AI skills, workflows, templates, and plugins with the world. 
              Our AI helps you create the perfect listing in minutes.
            </p>
          </div>

          {/* Upload Options */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {uploadOptions.map((option, index) => (
              <Card 
                key={option.title}
                className="glass hover:shadow-glow transition-all cursor-pointer group animate-fade-in-up" 
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={option.action}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <option.icon className="h-8 w-8 text-white" />
                    </div>
                    <Badge variant="secondary" className="bg-white/[0.1] text-white/80">
                      {option.badge}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-text-primary mb-2">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-base text-text-secondary">
                      {option.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full group-hover:shadow-glow transition-smooth">
                    {option.title === 'Upload from GitHub' ? (
                      <>
                        <Github className="h-4 w-4 mr-2" />
                        Get Started
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Create Manually
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">
                AI-Powered Features
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Our intelligent upload system uses Gemini AI to analyze your repository 
                and create the perfect marketplace listing
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="text-center animate-fade-in-up" 
                  style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
                >
                  <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-500/20 border border-white/[0.1] flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: 1, title: 'Connect GitHub', description: 'Link your GitHub account with OAuth' },
                { step: 2, title: 'Select Repository', description: 'Choose which repository to upload' },
                { step: 3, title: 'AI Analysis', description: 'Gemini AI scans and analyzes your code' },
                { step: 4, title: 'Review & Upload', description: 'Edit AI-generated details and publish' }
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {item.description}
                  </p>
                  {item.step < 4 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  )
}
