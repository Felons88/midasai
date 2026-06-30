import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  BookOpen, 
  Code, 
  Key, 
  Bell, 
  Package, 
  ShieldCheck, 
  BarChart3, 
  Globe, 
  Zap,
  ArrowRight,
  Github,
  FileText,
  Terminal
} from "lucide-react"

export const metadata: Metadata = {
  title: "API Documentation - MidasAI",
  description: "Complete API documentation for the MidasAI platform including REST APIs, webhooks, OAuth, and MCP integration",
}

const apiSections = [
  {
    title: "Getting Started",
    description: "Learn the basics of integrating with MidasAI APIs",
    icon: BookOpen,
    color: "blue",
    items: [
      { title: "Authentication", href: "/docs/api/authentication", description: "API key authentication and OAuth flows" },
      { title: "Rate Limits", href: "/docs/api/rate-limits", description: "Understanding rate limits and quotas" },
      { title: "Error Handling", href: "/docs/api/errors", description: "Common error codes and responses" },
      { title: "SDKs & Libraries", href: "/docs/api/sdks", description: "Official SDKs for popular languages" },
    ]
  },
  {
    title: "Core APIs",
    description: "Primary REST APIs for platform functionality",
    icon: Code,
    color: "green",
    items: [
      { title: "Skills API", href: "/docs/api/skills", description: "Browse and manage AI skills" },
      { title: "Marketplace API", href: "/docs/api/marketplace", description: "Access marketplace listings and transactions" },
      { title: "Users API", href: "/docs/api/users", description: "User management and profiles" },
      { title: "Analytics API", href: "/docs/api/analytics", description: "Usage analytics and metrics" },
    ]
  },
  {
    title: "Developer Tools",
    description: "Tools and services for developers",
    icon: Zap,
    color: "amber",
    items: [
      { title: "API Keys", href: "/docs/api/keys", description: "Create and manage API keys" },
      { title: "Webhooks", href: "/docs/api/webhooks", description: "Configure real-time event notifications" },
      { title: "OAuth Apps", href: "/docs/api/oauth", description: "Build OAuth applications" },
      { title: "MCP Platform", href: "/docs/api/mcp", description: "Model Context Protocol integration" },
    ]
  },
  {
    title: "Reference",
    description: "Complete API reference and examples",
    icon: FileText,
    color: "purple",
    items: [
      { title: "API Reference", href: "/docs/api/reference", description: "Complete endpoint documentation" },
      { title: "OpenAPI Spec", href: "/docs/api/openapi", description: "Downloadable OpenAPI specification" },
      { title: "Code Examples", href: "/docs/api/examples", description: "Ready-to-use code samples" },
      { title: "Changelog", href: "/docs/api/changelog", description: "API updates and changes" },
    ]
  }
]

const quickStartSteps = [
  { step: 1, title: "Get API Key", description: "Create an API key in your developer dashboard" },
  { step: 2, title: "Choose SDK", description: "Install our SDK for your preferred language" },
  { step: 3, title: "Make First Call", description: "Test your integration with a simple API call" },
  { step: 4, title: "Build Your App", description: "Start building your application" }
]

export default function ApiDocumentationPage() {
  return (
    <div className="min-h-screen bg-[#07070b]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
        <div className="relative px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Code className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">API Documentation</h1>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Everything you need to integrate with the MidasAI platform. From simple API calls to complex OAuth flows and MCP integrations.
            </p>
            <div className="flex items-center gap-4 justify-center">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
                <BookOpen className="h-4 w-4 mr-2" />
                Quick Start Guide
              </Button>
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                <Github className="h-4 w-4 mr-2" />
                GitHub SDKs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Quick Start</h2>
            <p className="text-white/60">Get up and running in 4 simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStartSteps.map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                </div>
                <p className="text-white/60 text-sm">{item.description}</p>
                {item.step < 4 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Sections */}
      <div className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {apiSections.map((section) => (
              <Card key={section.title} className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl bg-${section.color}-500/10 flex items-center justify-center`}>
                      <section.icon className={`h-6 w-6 text-${section.color}-400`} />
                    </div>
                    <div>
                      <CardTitle className="text-white">{section.title}</CardTitle>
                      <CardDescription className="text-white/60">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between p-3 rounded-lg border border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                    >
                      <div>
                        <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-white/40">{item.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Try It Now</h2>
            <p className="text-white/60">Example API call to get started</p>
          </div>
          
          <Card className="border-white/[0.08] bg-[#0a0a0f]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-blue-400">JavaScript</span>
              </div>
              <pre className="text-sm text-white/80 overflow-x-auto">
                <code>{`// Install the MidasAI SDK
npm install @midasai/sdk

// Make your first API call
import { MidasAI } from '@midasai/sdk';

const client = new MidasAI({
  apiKey: 'your-api-key-here'
});

const skills = await client.skills.list();
console.log(skills);`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build?</h2>
          <p className="text-white/60 mb-8">
            Join thousands of developers building on the MidasAI platform
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Link href="/developers">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600">
                <Zap className="h-4 w-4 mr-2" />
                Go to Developer Portal
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                <FileText className="h-4 w-4 mr-2" />
                View Full Reference
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
