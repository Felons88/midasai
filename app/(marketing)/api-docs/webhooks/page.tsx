import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, CheckCircle, Code, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function WebhooksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Webhooks</h1>
            <p className="text-xl text-text-secondary">
              Set up webhooks to receive real-time notifications about marketplace events
            </p>
          </div>

          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">What are Webhooks?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  Webhooks allow you to receive real-time notifications when specific events occur in the MidasAI marketplace. Instead of polling our API, you can set up endpoints on your server that we'll call when events happen.
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Supported Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { event: "listing.created", description: "A new listing is created" },
                    { event: "listing.updated", description: "A listing is updated" },
                    { event: "listing.deleted", description: "A listing is deleted" },
                    { event: "purchase.completed", description: "A purchase is completed" },
                    { event: "review.created", description: "A new review is posted" },
                    { event: "user.subscribed", description: "A user subscribes to a plan" },
                  ].map((item) => (
                    <div key={item.event} className="flex items-start gap-3 p-4 rounded-lg bg-surface">
                      <Globe className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                      <div>
                        <code className="text-sm text-text-primary font-mono">{item.event}</code>
                        <p className="text-sm text-text-secondary mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Setting Up Webhooks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Create an endpoint</p>
                      <p className="text-sm text-text-secondary">Set up a publicly accessible HTTPS endpoint on your server</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Register the webhook</p>
                      <p className="text-sm text-text-secondary">Use the API to register your webhook URL</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Verify the signature</p>
                      <p className="text-sm text-text-secondary">Validate webhook signatures to ensure authenticity</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Webhook Payload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  All webhook payloads include the following structure:
                </p>
                <div className="bg-surface rounded-lg p-4 font-mono text-sm text-text-primary overflow-x-auto">
                  <pre>{`{
  "event": "listing.created",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00Z",
  "signature": "sha256=..."
}`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-amber-500/20 bg-amber-500/[0.02]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                  <CardTitle className="text-xl text-amber-400">Security Best Practices</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-text-secondary">
                  <li>• Always verify webhook signatures using your secret key</li>
                  <li>• Use HTTPS for your webhook endpoints</li>
                  <li>• Respond quickly (within 5 seconds) with a 200 status code</li>
                  <li>• Implement idempotency to handle duplicate events</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
