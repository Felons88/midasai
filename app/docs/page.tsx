import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-muted-foreground text-lg">
          Everything you need to get started with MidasAI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <section.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
