import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Code, Zap, Users, Shield, Settings } from "lucide-react"
import Link from "next/link"

export default function DocsPage() {
  const sections = [
    { icon: Book, title: "Getting Started", description: "Quick start guide", href: "/docs/getting-started" },
    { icon: Code, title: "API Reference", description: "Complete API documentation", href: "/docs/api" },
    { icon: Zap, title: "Integration Guides", description: "Connect with your tools", href: "/docs/integrations" },
    { icon: Users, title: "Creator Guide", description: "Publish your own tools", href: "/docs/creators" },
    { icon: Shield, title: "Security", description: "Security best practices", href: "/docs/security" },
    { icon: Settings, title: "Configuration", description: "Setup and configuration", href: "/docs/configuration" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
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
                  <section.icon className="h-8 w-8 text-cta group-hover:scale-110 transition-smooth" />
                  <CardTitle className="text-xl text-text-primary">{section.title}</CardTitle>
                  <CardDescription className="text-text-secondary">{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
