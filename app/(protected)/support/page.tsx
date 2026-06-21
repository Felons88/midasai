import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Mail, Book, HelpCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Support Center</h1>
        <p className="text-white/50">Get help with your account, listings, or technical issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card className="border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <CardHeader className="space-y-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Book className="h-6 w-6 text-amber-400" />
            </div>
            <CardTitle className="text-xl text-white">Documentation</CardTitle>
            <CardDescription className="text-sm text-white/50">
              Browse our comprehensive guides and tutorials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/docs">View Docs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <CardHeader className="space-y-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-blue-400" />
            </div>
            <CardTitle className="text-xl text-white">FAQ</CardTitle>
            <CardDescription className="text-sm text-white/50">
              Find answers to commonly asked questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/faq">View FAQ</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <CardHeader className="space-y-4">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-green-400" />
            </div>
            <CardTitle className="text-xl text-white">Community</CardTitle>
            <CardDescription className="text-sm text-white/50">
              Join our Discord server for live support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link href="https://discord.gg/midasai" target="_blank" rel="noopener noreferrer">
                Join Discord
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
        <Card className="border border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Email Support</h3>
                <p className="text-white/50 text-sm mb-2">
                  For general inquiries and account issues
                </p>
                <a href="mailto:support@midasai.com" className="text-amber-400 hover:text-amber-300 text-sm">
                  support@midasai.com
                </a>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Response Times</h3>
              <ul className="space-y-2 text-sm text-white/50">
                <li>• General inquiries: 24-48 hours</li>
                <li>• Technical issues: 12-24 hours</li>
                <li>• Urgent matters: 4-8 hours</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/docs/api" className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <h3 className="text-white font-medium mb-1">API Documentation</h3>
            <p className="text-white/50 text-sm">Integration guides and reference</p>
          </Link>
          <Link href="/docs/creator" className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <h3 className="text-white font-medium mb-1">Creator Guide</h3>
            <p className="text-white/50 text-sm">How to create and manage listings</p>
          </Link>
          <Link href="/docs/developer" className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <h3 className="text-white font-medium mb-1">Developer Guide</h3>
            <p className="text-white/50 text-sm">API keys, webhooks, and integrations</p>
          </Link>
          <Link href="/docs/billing" className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            <h3 className="text-white font-medium mb-1">Billing Help</h3>
            <p className="text-white/50 text-sm">Subscriptions, invoices, and refunds</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
