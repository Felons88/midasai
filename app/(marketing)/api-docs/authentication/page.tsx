import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle, AlertTriangle, Key } from "lucide-react"
import Link from "next/link"

export default function AuthenticationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Authentication</h1>
            <p className="text-xl text-text-secondary">
              Secure your API integrations with proper authentication
            </p>
          </div>

          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">API Keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  API keys are used to authenticate your requests to the MidasAI API. Each key is unique to your account and should be kept secret.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Generate API Keys</p>
                      <p className="text-sm text-text-secondary">Create keys in your developer dashboard with specific permissions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Use Environment Variables</p>
                      <p className="text-sm text-text-secondary">Store keys in environment variables, never in code</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Rotate Keys Regularly</p>
                      <p className="text-sm text-text-secondary">Regenerate keys periodically for enhanced security</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Making Authenticated Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  Include your API key in the Authorization header using the Bearer token scheme:
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
                <CardTitle className="text-2xl text-text-primary">OAuth 2.0</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-text-secondary">
                  For applications that need user authorization, we support OAuth 2.0 for secure third-party integrations.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Register Your Application</p>
                      <p className="text-sm text-text-secondary">Create an OAuth application in your developer dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Implement Authorization Flow</p>
                      <p className="text-sm text-text-secondary">Follow the OAuth 2.0 authorization code flow</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-cta mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-text-primary">Handle Token Refresh</p>
                      <p className="text-sm text-text-secondary">Implement refresh token logic for long-lived sessions</p>
                    </div>
                  </div>
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
                  <li>• Never commit API keys to version control</li>
                  <li>• Use different keys for development and production</li>
                  <li>• Implement rate limiting on your side to prevent abuse</li>
                  <li>• Monitor API usage for suspicious activity</li>
                  <li>• Revoke compromised keys immediately</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
