import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, Code, Zap, Globe, Package, Users } from "lucide-react"
import Link from "next/link"

const endpoints = [
  {
    category: "Listings",
    icon: Book,
    routes: [
      { method: "GET", path: "/v1/listings", description: "Get all listings" },
      { method: "GET", path: "/v1/listings/:id", description: "Get a specific listing" },
      { method: "POST", path: "/v1/listings", description: "Create a new listing" },
      { method: "PUT", path: "/v1/listings/:id", description: "Update a listing" },
      { method: "DELETE", path: "/v1/listings/:id", description: "Delete a listing" },
    ]
  },
  {
    category: "Users",
    icon: Users,
    routes: [
      { method: "GET", path: "/v1/users/me", description: "Get current user" },
      { method: "GET", path: "/v1/users/:id", description: "Get a specific user" },
      { method: "PUT", path: "/v1/users/me", description: "Update current user" },
    ]
  },
  {
    category: "Analytics",
    icon: Zap,
    routes: [
      { method: "GET", path: "/v1/analytics/listings", description: "Get listing analytics" },
      { method: "GET", path: "/v1/analytics/usage", description: "Get API usage stats" },
    ]
  },
  {
    category: "Webhooks",
    icon: Globe,
    routes: [
      { method: "GET", path: "/v1/webhooks", description: "List webhooks" },
      { method: "POST", path: "/v1/webhooks", description: "Create webhook" },
      { method: "DELETE", path: "/v1/webhooks/:id", description: "Delete webhook" },
    ]
  },
  {
    category: "MCP Servers",
    icon: Package,
    routes: [
      { method: "GET", path: "/v1/mcp/servers", description: "List MCP servers" },
      { method: "GET", path: "/v1/mcp/servers/:id", description: "Get MCP server details" },
    ]
  },
]

export default function ReferencePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">API Reference</h1>
            <p className="text-xl text-text-secondary">
              Complete documentation of all API endpoints
            </p>
          </div>

          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {endpoints.map((category, index) => (
              <Card key={category.category} className="glass">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <category.icon className="h-6 w-6 text-cta" />
                    <CardTitle className="text-2xl text-text-primary">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.routes.map((route) => (
                      <div key={route.path} className="flex items-center gap-4 p-4 rounded-lg bg-surface">
                        <span className={`px-3 py-1 rounded text-xs font-bold ${
                          route.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                          route.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                          route.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                          route.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {route.method}
                        </span>
                        <code className="flex-1 text-sm text-text-primary font-mono">{route.path}</code>
                        <span className="text-sm text-text-secondary">{route.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="glass">
              <CardContent className="p-8 text-center">
                <p className="text-text-secondary mb-4">
                  Need more details on specific endpoints?
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-cta text-black font-semibold hover:bg-cta/90 transition-colors"
                >
                  Contact Support
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
