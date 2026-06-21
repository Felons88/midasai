import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function GettingStartedPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Getting Started</h1>
            <p className="text-xl text-text-secondary">
              Learn how to authenticate and make your first API call
            </p>
          </div>

          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Prerequisites</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">Create an account</p>
                    <p className="text-sm text-text-secondary">Sign up for a MidasAI account to get access to the API</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">Generate API keys</p>
                    <p className="text-sm text-text-secondary">Create API keys in your developer dashboard</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary">Choose your plan</p>
                    <p className="text-sm text-text-secondary">Select a plan that fits your usage needs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  All API requests require authentication using your API key. Include your key in the Authorization header:
                </p>
                <div className="bg-surface rounded-lg p-4 font-mono text-sm text-text-primary overflow-x-auto">
                  <pre>Authorization: Bearer YOUR_API_KEY</pre>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Your First API Call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  Here's a simple example to fetch listings from the marketplace:
                </p>
                <div className="bg-surface rounded-lg p-4 font-mono text-sm text-text-primary overflow-x-auto">
                  <pre>{`curl -X GET https://api.midasai.com/v1/listings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/api-docs/reference" className="flex items-center gap-3 p-4 rounded-lg bg-surface hover:bg-elevated transition-smooth group">
                  <Code className="h-5 w-5 text-cta" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">API Reference</p>
                    <p className="text-sm text-text-secondary">Explore all available endpoints</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-text-tertiary group-hover:text-cta transition-colors" />
                </Link>
                <Link href="/api-docs/authentication" className="flex items-center gap-3 p-4 rounded-lg bg-surface hover:bg-elevated transition-smooth group">
                  <CheckCircle className="h-5 w-5 text-cta" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">Authentication Guide</p>
                    <p className="text-sm text-text-secondary">Learn about security best practices</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-text-tertiary group-hover:text-cta transition-colors" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
