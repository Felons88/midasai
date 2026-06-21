import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

const faqData = [
  {
    category: "General",
    questions: [
      {
        q: "What is MidasAI?",
        a: "MidasAI is a marketplace for AI tools, skills, plugins, and automations. We provide a platform where creators can sell their AI-powered creations and developers can discover and integrate powerful AI tools into their applications."
      },
      {
        q: "How do I get started?",
        a: "Simply create an account to start exploring the marketplace. You can browse listings, download free resources, or purchase premium tools. If you're a creator, you can apply to become a verified seller and start listing your own AI creations."
      },
      {
        q: "Is MidasAI free to use?",
        a: "Yes! Creating an account and browsing the marketplace is completely free. Many listings are also available for free. Premium listings are priced individually by their creators."
      }
    ]
  },
  {
    category: "Purchasing & Downloads",
    questions: [
      {
        q: "How do I purchase a listing?",
        a: "Click on any listing to view its details, then click the 'Purchase' button. You'll be guided through a secure checkout process. Once payment is complete, you'll have immediate access to download the files."
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards through Stripe, including Visa, Mastercard, American Express, and Discover. We also support various regional payment methods."
      },
      {
        q: "Can I get a refund?",
        a: "Refunds are handled on a case-by-case basis. If you encounter technical issues or the listing doesn't match its description, please contact our support team within 14 days of purchase."
      },
      {
        q: "How do I access my purchases?",
        a: "All your purchases are available in the 'Purchases' section of your account dashboard. You can download them anytime, and we'll also send you an email with download links after purchase."
      }
    ]
  },
  {
    category: "Creator Program",
    questions: [
      {
        q: "How do I become a creator?",
        a: "Apply for creator status through your account settings. Once approved, you can start uploading and selling your AI tools, skills, and automations on the marketplace."
      },
      {
        q: "What are the fees for creators?",
        a: "MidasAI charges a platform fee on each sale. The exact fee depends on your creator tier and sales volume. We offer competitive rates and higher payouts for top performers."
      },
      {
        q: "How do payouts work?",
        a: "Payouts are processed monthly through Stripe Connect. You'll need to connect your Stripe account to receive payments. Minimum payout thresholds apply."
      },
      {
        q: "Can I update my listings after publishing?",
        a: "Yes, you can update your listings at any time. Changes will be reviewed by our moderation team before going live to ensure quality and compliance."
      }
    ]
  },
  {
    category: "Developer API",
    questions: [
      {
        q: "How do I get API access?",
        a: "API access is available through our developer plans. Visit the Developer Dashboard to generate API keys and view documentation."
      },
      {
        q: "What can I do with the API?",
        a: "The API allows you to programmatically access listings, user data, analytics, and more. You can build custom integrations, automate workflows, and create powerful applications on top of the MidasAI platform."
      },
      {
        q: "Are there rate limits?",
        a: "Yes, API rate limits depend on your plan. Free tier has basic limits, while paid plans offer higher quotas. Check the API documentation for specific limits."
      },
      {
        q: "Do you offer SDKs?",
        a: "We provide official SDKs for popular programming languages including JavaScript, Python, and Go. Community-maintained SDKs are also available for other languages."
      }
    ]
  },
  {
    category: "Account & Security",
    questions: [
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the login page and enter your email. You'll receive a password reset link. If you don't receive it, check your spam folder or contact support."
      },
      {
        q: "Is my data secure?",
        a: "Absolutely. We use industry-standard encryption, secure authentication, and follow best practices for data protection. Your payment information is processed through Stripe and never stored on our servers."
      },
      {
        q: "Can I delete my account?",
        a: "Yes, you can delete your account from the account settings page. Note that this will permanently remove all your data, purchases, and creator listings. This action cannot be undone."
      },
      {
        q: "How do I enable two-factor authentication?",
        a: "2FA can be enabled in your account security settings. We support authenticator apps (Google Authenticator, Authy) and SMS-based 2FA."
      }
    ]
  }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpen = new Set(openItems)
    if (newOpen.has(id)) {
      newOpen.delete(id)
    } else {
      newOpen.add(id)
    }
    setOpenItems(newOpen)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="h-10 w-10 text-cta" />
              <h1 className="text-5xl md:text-6xl font-bold text-text-primary">FAQ</h1>
            </div>
            <p className="text-xl text-text-secondary">
              Frequently asked questions about MidasAI
            </p>
          </div>

          {faqData.map((category, categoryIndex) => (
            <div key={category.category} className="mb-8 animate-fade-in-up" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
              <h2 className="text-2xl font-semibold text-text-primary mb-6">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const itemId = `${categoryIndex}-${itemIndex}`
                  const isOpen = openItems.has(itemId)
                  return (
                    <Card key={itemId} className="glass">
                      <CardContent className="p-0">
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between p-6 text-left hover:bg-surface/50 transition-colors"
                        >
                          <span className="font-medium text-text-primary pr-8">{item.q}</span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-text-tertiary flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-text-tertiary flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-6 pt-0">
                            <p className="text-text-secondary leading-relaxed">{item.a}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}

          <Card className="glass mt-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Still have questions?</h3>
              <p className="text-text-secondary mb-6">
                Can't find the answer you're looking for? Please reach out to our support team.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-cta text-black font-semibold hover:bg-cta/90 transition-colors"
              >
                Contact Support
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
