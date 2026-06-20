import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Star, 
  Download, 
  Heart, 
  Share2, 
  Bookmark, 
  MessageSquare, 
  Eye, 
  Calendar,
  User,
  Tag,
  Github,
  ExternalLink,
  Code,
  FileText,
  Zap,
  Shield,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Copy,
  Play
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

async function getContentDetails(id: string) {
  try {
    const supabase = await createClient()
    
    // Try to get from different content types
    const [skillResult, workflowResult, listingResult] = await Promise.all([
      supabase.from('skills').select('*').eq('id', id).single(),
      supabase.from('workflows').select('*').eq('id', id).single(),
      supabase.from('listings').select('*').eq('id', id).single()
    ])

    // Return the first found result
    if (skillResult.data && !skillResult.error) {
      return { ...skillResult.data, type: 'skill' }
    }
    if (workflowResult.data && !workflowResult.error) {
      return { ...workflowResult.data, type: 'workflow' }
    }
    if (listingResult.data && !listingResult.error) {
      return { ...listingResult.data, type: 'listing' }
    }

    return null
  } catch (error) {
    console.error('Error fetching content details:', error)
    return null
  }
}

async function getRelatedContent(type: string, tags: string[] = [], excludeId: string) {
  try {
    const supabase = await createClient()
    
    let query
    if (type === 'skill') {
      query = supabase.from('skills').select('*').neq('id', excludeId).limit(6)
    } else if (type === 'workflow') {
      query = supabase.from('workflows').select('*').neq('id', excludeId).limit(6)
    } else {
      query = supabase.from('listings').select('*').neq('id', excludeId).limit(6)
    }

    const { data } = await query.order('created_at', { ascending: false })
    return data || []
  } catch (error) {
    console.error('Error fetching related content:', error)
    return []
  }
}

export default async function ContentDetailsPage({ params }: { params: { id: string } }) {
  const content = await getContentDetails(params.id)
  
  if (!content) {
    notFound()
  }

  const relatedContent = await getRelatedContent(content.type, content.tags || [], params.id)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill': return <Zap className="h-5 w-5" />
      case 'workflow': return <Code className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'skill': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'workflow': return 'bg-green-500/10 text-green-400 border-green-500/20'
      default: return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-[#07070b]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
        <div className="relative px-8 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/60 mb-6">
              <Link href="/marketplace" className="hover:text-white transition-colors">
                Marketplace
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/${content.type}s`} className="hover:text-white transition-colors capitalize">
                {content.type}s
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">{content.name}</span>
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column - Main Content */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`h-16 w-16 rounded-xl ${getTypeColor(content.type)} border flex items-center justify-center`}>
                    {getTypeIcon(content.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-white">{content.name}</h1>
                      <Badge variant="outline" className={`${getTypeColor(content.type)} capitalize`}>
                        {content.type}
                      </Badge>
                    </div>
                    <p className="text-white/70 text-lg">{content.description}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-400 fill-current" />
                    <span className="text-white font-medium">{content.rating || 4.8}</span>
                    <span className="text-white/50">({content.reviews || 127} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-white/50" />
                    <span className="text-white">{content.downloads || 1234}</span>
                    <span className="text-white/50">downloads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-white/50" />
                    <span className="text-white">{content.likes || 456}</span>
                    <span className="text-white/50">likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-white/50" />
                    <span className="text-white">{content.views || 8901}</span>
                    <span className="text-white/50">views</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-8">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                    <Download className="h-4 w-4 mr-2" />
                    Download {content.type}
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                    <Heart className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Tags */}
                {content.tags && content.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-8">
                    <Tag className="h-4 w-4 text-white/50" />
                    <div className="flex flex-wrap gap-2">
                      {content.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-white/10 text-white/80 hover:bg-white/20">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Preview */}
                <Card className="border-white/[0.08] bg-white/[0.02] mb-8">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {content.type === 'skill' ? 'Skill Details' : content.type === 'workflow' ? 'Workflow Overview' : 'Content Overview'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <div className="text-white/70 leading-relaxed">
                        {content.long_description || content.description || `This is a comprehensive ${content.type} that provides powerful functionality for your needs. It has been carefully designed and tested to ensure high performance and reliability.`}
                      </div>
                      
                      {/* Features */}
                      {(content.features || content.capabilities) && (
                        <div className="mt-6">
                          <h4 className="text-white font-semibold mb-3">Key Features</h4>
                          <ul className="space-y-2">
                            {(content.features || content.capabilities || ['Easy to use', 'High performance', 'Well documented']).map((feature: string, index: number) => (
                              <li key={index} className="flex items-center gap-2 text-white/70">
                                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Requirements */}
                      {content.requirements && (
                        <div className="mt-6">
                          <h4 className="text-white font-semibold mb-3">Requirements</h4>
                          <div className="text-white/70">
                            {content.requirements}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Installation/Usage */}
                <Card className="border-white/[0.08] bg-white/[0.02] mb-8">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Installation & Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Installation</h4>
                        <div className="bg-[#0a0a0f] rounded-lg p-4 overflow-x-auto">
                          <code className="text-sm text-green-400">
                            npm install {content.package_name || content.name.toLowerCase().replace(/\s+/g, '-')}
                          </code>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-semibold mb-2">Basic Usage</h4>
                        <div className="bg-[#0a0a0f] rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-white/80">
                            <code>{`import { ${content.name} } from '${content.package_name || content.name.toLowerCase().replace(/\s+/g, '-')}';

// Initialize the ${content.type}
const instance = new ${content.name}();

// Start using it
const result = await instance.process();`}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews */}
                <Card className="border-white/[0.08] bg-white/[0.02]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Reviews & Feedback
                      </CardTitle>
                      <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                        Write Review
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((review) => (
                        <div key={review} className="border-b border-white/[0.06] pb-4 last:border-0">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                              <span className="text-black font-semibold text-sm">JD</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">John Doe</span>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="h-4 w-4 text-amber-400 fill-current" />
                                  ))}
                                </div>
                                <span className="text-white/50 text-sm">2 days ago</span>
                              </div>
                              <p className="text-white/70 text-sm">
                                Excellent {content.type}! Exactly what I needed for my project. Well documented and easy to implement.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:w-80">
                {/* Creator Info */}
                <Card className="border-white/[0.08] bg-white/[0.02] mb-6">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Creator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{content.creator_name || 'Anonymous Creator'}</h3>
                        <p className="text-white/50 text-sm">{content.followers || 1234} followers</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                        Follow
                      </Button>
                      <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card className="border-white/[0.08] bg-white/[0.02] mb-6">
                  <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {content.price ? `$${content.price}` : 'Free'}
                      </div>
                      <p className="text-white/50 text-sm mb-4">
                        {content.price ? 'One-time purchase' : 'Open source'}
                      </p>
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black">
                        {content.price ? 'Purchase Now' : 'Download Free'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card className="border-white/[0.08] bg-white/[0.02] mb-6">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/50">First Released</span>
                        <span className="text-white">{new Date(content.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Last Updated</span>
                        <span className="text-white">{new Date(content.updated_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Version</span>
                        <span className="text-white">{content.version || '1.0.0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">License</span>
                        <span className="text-white">{content.license || 'MIT'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Links */}
                {(content.github_url || content.website_url || content.documentation_url) && (
                  <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {content.github_url && (
                          <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10" asChild>
                            <Link href={content.github_url} target="_blank">
                              <Github className="h-4 w-4 mr-2" />
                              GitHub Repository
                            </Link>
                          </Button>
                        )}
                        {content.website_url && (
                          <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10" asChild>
                            <Link href={content.website_url} target="_blank">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Website
                            </Link>
                          </Button>
                        )}
                        {content.documentation_url && (
                          <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10" asChild>
                            <Link href={content.documentation_url} target="_blank">
                              <FileText className="h-4 w-4 mr-2" />
                              Documentation
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Content */}
      {relatedContent.length > 0 && (
        <div className="px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Related {content.type}s</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedContent.map((item) => (
                <Link key={item.id} href={`/details/${item.id}`}>
                  <Card className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`h-10 w-10 rounded-lg ${getTypeColor(item.type)} border flex items-center justify-center`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-white/50 text-sm line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-current" />
                          <span className="text-white/70 text-sm">{item.rating || 4.5}</span>
                        </div>
                        <Badge variant="secondary" className="bg-white/10 text-white/80 text-xs">
                          {item.price ? `$${item.price}` : 'Free'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
