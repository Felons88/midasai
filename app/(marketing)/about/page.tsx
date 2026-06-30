import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Zap, Globe, Mail } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">About MidasAI</h1>
            <p className="text-xl text-text-secondary">
              The premier marketplace for AI tools, skills, and automations
            </p>
          </div>

          <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-semibold mb-6 text-text-primary">Our Mission</h2>
            <p className="text-lg text-text-secondary mb-4 leading-relaxed">
              MidasAI was founded with a simple goal: to make AI tools accessible to everyone.
              We believe that the future of software development lies in the collaboration between
              humans and AI, and we're building the infrastructure to make that happen.
            </p>
            <p className="text-lg text-text-secondary leading-relaxed">
              Our marketplace connects creators who build amazing AI tools with developers and 
              businesses who need them. Every listing is reviewed for quality, ensuring that 
              you get access to the best tools available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Card className="glass">
              <CardHeader>
                <Target className="h-8 w-8 text-cta mb-4" />
                <CardTitle className="text-xl text-text-primary">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  Democratize access to AI tools and empower creators worldwide
                </p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader>
                <Users className="h-8 w-8 text-cta mb-4" />
                <CardTitle className="text-xl text-text-primary">Our Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  Join thousands of developers and creators building the future of AI
                </p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader>
                <Zap className="h-8 w-8 text-cta mb-4" />
                <CardTitle className="text-xl text-text-primary">Our Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  A secure, reliable marketplace for AI tools and resources
                </p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader>
                <Globe className="h-8 w-8 text-cta mb-4" />
                <CardTitle className="text-xl text-text-primary">Our Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  Serving customers in over 100 countries worldwide
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <h2 className="text-2xl font-semibold text-text-primary">Contact Us</h2>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-text-secondary mb-4">
                Have questions? We'd love to hear from you.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-cta hover:text-cta-light transition-colors"
              >
                <Mail className="h-5 w-5" />
                Get in touch
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
