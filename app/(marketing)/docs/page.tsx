import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Code, Zap, Users, Shield, Settings, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DocsPage() {
  const sections = [
    { icon: Book, title: "Getting Started", description: "Quick start guide for new users", href: "/api-docs/getting-started" },
    { icon: Code, title: "API Reference", description: "Complete API documentation", href: "/api-docs/reference" },
    { icon: Zap, title: "Integration Guides", description: "Connect with your tools", href: "/api-docs/webhooks" },
    { icon: Users, title: "Creator Guide", description: "Publish your own tools", href: "/creator/dashboard" },
    { icon: Shield, title: "Security", description: "Security best practices", href: "/api-docs/authentication" },
    { icon: Settings, title: "Configuration", description: "Setup and configuration", href: "/account/settings" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <Book className="h-8 w-8 text-cta" />
              <h1 className="text-5xl md:text-6xl font-bold text-text-primary">Documentation</h1>
            </div>
            <p className="text-xl text-text-secondary">
              Everything you need to get started with MidasAI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {sections.map((section, index) => (
              <Link key={section.title} href={section.href}>
                <Card className="glass hover:shadow-glow transition-smooth cursor-pointer h-full group" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center group-hover:bg-elevated transition-smooth">
                      <section.icon className="h-6 w-6 text-cta group-hover:scale-110 transition-smooth" />
                    </div>
                    <CardTitle className="text-xl text-text-primary">{section.title}</CardTitle>
                    <CardDescription className="text-text-secondary">{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-cta text-sm font-medium">
                      <span>Learn more</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="glass mt-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Need more help?</h3>
              <p className="text-text-secondary mb-6">
                Check out our FAQ or contact our support team for assistance.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-cta text-black font-semibold hover:bg-cta/90 transition-colors"
                >
                  View FAQ
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-lg border border-white/[0.2] text-text-primary hover:bg-white/[0.05] transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
