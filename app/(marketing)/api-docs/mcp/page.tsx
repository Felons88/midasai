import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, CheckCircle, Code, Zap } from "lucide-react"
import Link from "next/link"

export default function MCPPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">MCP Integration</h1>
            <p className="text-xl text-text-secondary">
              Learn how to integrate with Model Context Protocol servers
            </p>
          </div>

          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">What is MCP?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  The Model Context Protocol (MCP) is a standardized protocol for connecting AI models to external data sources and tools. MidasAI provides a marketplace of MCP servers that extend AI capabilities.
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Discovering MCP Servers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  Browse our marketplace to find MCP servers that suit your needs:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Browse the MCP Category</p>
                      <p className="text-sm text-text-secondary">Explore available MCP servers in our marketplace</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Read Documentation</p>
                      <p className="text-sm text-text-secondary">Each server includes setup instructions and examples</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Install and Configure</p>
                      <p className="text-sm text-text-secondary">Follow the server-specific installation guide</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Integration Example</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  Here's a basic example of connecting to an MCP server:
                </p>
                <div className="bg-surface rounded-lg p-4 font-mono text-sm text-text-primary overflow-x-auto">
                  <pre>{`import { MCPClient } from '@midasai/mcp-sdk'

const client = new MCPClient({
  apiKey: 'YOUR_API_KEY',
  serverId: 'server-id-from-marketplace'
})

// Connect to the server
await client.connect()

// Use the server's tools
const result = await client.callTool('search', {
  query: 'example search'
})

console.log(result)`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Publishing MCP Servers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  Created an MCP server? List it on MidasAI to reach thousands of developers:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Prepare Your Server</p>
                      <p className="text-sm text-text-secondary">Ensure your server follows MCP specifications</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Create a Listing</p>
                      <p className="text-sm text-text-secondary">Upload your server with documentation and examples</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Earn Revenue</p>
                      <p className="text-sm text-text-secondary">Monetize your MCP server through our marketplace</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
