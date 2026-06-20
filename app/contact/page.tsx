import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Mail, MessageSquare, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Contact Us</h1>
            <p className="text-xl text-text-secondary">
              Get in touch with our team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Send us a message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-text-secondary">Name</Label>
                  <Input id="name" placeholder="Your name" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-text-secondary">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="subject" className="text-text-secondary">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="message" className="text-text-secondary">Message</Label>
                  <textarea
                    id="message"
                    className="mt-1 flex min-h-[120px] w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/50"
                    placeholder="Your message..."
                  />
                </div>
                <Button className="w-full h-12 shadow-glow">Send Message</Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-cta mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1 text-text-primary">Email</h3>
                      <p className="text-text-secondary">hello@midasai.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-6 w-6 text-cta mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1 text-text-primary">Support</h3>
                      <p className="text-text-secondary">support@midasai.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-cta mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1 text-text-primary">Location</h3>
                      <p className="text-text-secondary">San Francisco, CA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
