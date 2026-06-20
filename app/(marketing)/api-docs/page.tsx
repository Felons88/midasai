import { Book, Code, Zap, Shield, Globe, Users, Package, Search, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#07070b]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
        <div className="relative px-8 py-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <Code className="h-6 w-6 text-black" />
              </div>
              <h1 className="text-5xl font-bold text-white">MidasAI API</h1>
            </div>
            <p className="text-xl text-white/60 mb-8 max-w-3xl mx-auto">
              Build powerful integrations with the MidasAI marketplace. Access listings, analytics, user data, and more through our RESTful API.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/api-docs/getting-started"
                className="flex items-center gap-2 h-12 px-6 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
              >
                <Zap className="h-5 w-5" />
                Get Started
              </Link>
              <Link
                href="/api-docs/reference"
                className="flex items-center gap-2 h-12 px-6 rounded-lg border border-white/[0.2] text-white hover:bg-white/[0.05] transition-colors"
              >
                <Book className="h-5 w-5" />
                API Reference
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-8 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/api-docs/getting-started"
            className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                Getting Started
              </h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Learn how to authenticate, make your first API call, and understand the basics of the MidasAI API.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <span>Start building</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/api-docs/authentication"
            className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                Authentication
              </h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Understand API keys, OAuth flows, and best practices for securing your integrations.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <span>Secure your app</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/api-docs/reference"
            className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Book className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                API Reference
              </h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Complete documentation of all endpoints, parameters, and response formats.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <span>Browse endpoints</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/api-docs/webhooks"
            className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Globe className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                Webhooks
              </h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Set up webhooks to receive real-time notifications about marketplace events.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <span>Configure events</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/api-docs/mcp"
            className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Package className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                MCP Integration
              </h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Learn how to integrate with Model Context Protocol servers and AI agents.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <span>Connect MCP</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/api-docs/sdks"
            className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <Code className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                SDKs & Tools
              </h3>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Official SDKs, CLI tools, and code examples for popular programming languages.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <span>Download SDKs</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-8 py-16 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400 mb-2">1000+</div>
            <div className="text-sm text-white/60">API Endpoints</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400 mb-2">99.9%</div>
            <div className="text-sm text-white/60">Uptime SLA</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400 mb-2">10K</div>
            <div className="text-sm text-white/60">Requests/Minute</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400 mb-2">24/7</div>
            <div className="text-sm text-white/60">Support</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-8 py-16 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to build with MidasAI?</h2>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            Join thousands of developers building innovative applications on the MidasAI platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/api-docs/getting-started"
              className="flex items-center gap-2 h-12 px-6 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
            >
              <Zap className="h-5 w-5" />
              Start Building
            </Link>
            <Link
              href="/developers"
              className="flex items-center gap-2 h-12 px-6 rounded-lg border border-white/[0.2] text-white hover:bg-white/[0.05] transition-colors"
            >
              <Users className="h-5 w-5" />
              Developer Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
