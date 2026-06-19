import { Card, CardContent } from "@/components/ui/card"
import { Target, Users, Zap, Globe } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">About MidasAI</h1>
          <p className="text-muted-foreground text-lg">
            The premier marketplace for AI tools, skills, and automations
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <p className="text-muted-foreground text-lg mb-4">
            MidasAI was founded with a simple goal: to make AI tools accessible to everyone. 
            We believe that the future of software development lies in the collaboration between 
            humans and AI, and we're building the infrastructure to make that happen.
          </p>
          <p className="text-muted-foreground text-lg">
            Our marketplace connects creators who build amazing AI tools with developers and 
            businesses who need them. Every listing is reviewed for quality, ensuring that 
            you get access to the best tools available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <Target className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
              <p className="text-muted-foreground">
                Democratize access to AI tools and empower creators worldwide
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Users className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Our Community</h3>
              <p className="text-muted-foreground">
                Join thousands of developers and creators building the future of AI
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Zap className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Our Platform</h3>
              <p className="text-muted-foreground">
                A secure, reliable marketplace for AI tools and resources
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Globe className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Our Reach</h3>
              <p className="text-muted-foreground">
                Serving customers in over 100 countries worldwide
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
          <p className="text-muted-foreground text-lg mb-4">
            Have questions? We'd love to hear from you.
          </p>
          <a href="mailto:hello@midasai.com" className="text-primary hover:underline">
            hello@midasai.com
          </a>
        </div>
      </div>
    </div>
  )
}
