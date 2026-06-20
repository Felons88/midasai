import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { SUBSCRIPTION_TIERS } from "@/lib/monetization"

export default function PricingPage() {
  const freeTier = SUBSCRIPTION_TIERS[0]
  const proTier = SUBSCRIPTION_TIERS[1]
  const enterpriseTier = SUBSCRIPTION_TIERS[2]
  
  const plans = [
    {
      name: freeTier.tier,
      price: `$${freeTier.price}`,
      description: "Perfect for getting started",
      features: freeTier.features,
      cta: "Get Started",
    },
    {
      name: proTier.tier,
      price: `$${proTier.price}`,
      description: "For serious creators and power users",
      features: proTier.features,
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      name: enterpriseTier.tier,
      price: `$${enterpriseTier.price}`,
      description: "For teams and organizations",
      features: enterpriseTier.features,
      cta: "Contact Sales",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">Simple, Transparent Pricing</h1>
          <p className="text-xl text-text-secondary">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {plans.map((plan, index) => (
            <Card key={plan.name} className={`glass transition-smooth ${plan.popular ? 'border-cta/30 shadow-glow' : 'hover:shadow-glow'}`} style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="space-y-3">
                {plan.popular && (
                  <span className="text-xs font-bold text-cta bg-cta/10 w-fit px-3 py-1 rounded-full">MOST POPULAR</span>
                )}
                <CardTitle className="text-2xl text-text-primary">{plan.name}</CardTitle>
                <CardDescription className="text-text-secondary">{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-5xl font-bold text-text-primary">{plan.price}</span>
                  <span className="text-text-tertiary">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-cta flex-shrink-0" />
                      <span className="text-text-secondary text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full h-12 transition-smooth ${plan.popular ? 'shadow-glow' : ''}`} variant={plan.popular ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
