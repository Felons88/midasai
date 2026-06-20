"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Key, Globe, BarChart3, ArrowRight } from "lucide-react"

interface DeveloperOnboardingProps {
  onComplete?: () => void
}

export function DeveloperOnboarding({ onComplete }: DeveloperOnboardingProps) {
  const [step, setStep] = useState(1)
  const router = useRouter()

  const steps = [
    {
      title: "Welcome to Developer Portal",
      description: "Build powerful integrations with our API and connect your applications to MidasAI",
      icon: Code,
    },
    {
      title: "Generate API Keys",
      description: "Create secure API keys to authenticate your applications",
      icon: Key,
    },
    {
      title: "Set Up Webhooks",
      description: "Configure webhooks to receive real-time notifications about marketplace events",
      icon: Globe,
    },
    {
      title: "Monitor Usage Analytics",
      description: "Track your API usage, monitor performance, and optimize your integrations",
      icon: BarChart3,
    },
  ]

  const handleStepComplete = () => {
    if (step < steps.length) {
      setStep(step + 1)
    } else {
      onComplete?.()
      router.push('/developer')
    }
  }

  const handleSkip = () => {
    onComplete?.()
    router.push('/developer')
  }

  const CurrentIcon = steps[step - 1].icon

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Code className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Developer Portal</span>
            </div>
            <span className="text-sm text-text-tertiary">
              Step {step} of {steps.length}
            </span>
          </div>
          <CardTitle className="text-2xl">{steps[step - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-6 bg-surface rounded-lg">
            <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <CurrentIcon className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-text-secondary">{steps[step - 1].description}</p>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2">
            {steps.map((_, index) => {
              return (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded-full ${
                    index < step ? 'bg-blue-500' : 'bg-white/10'
                  }`}
                />
              )
            })}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleStepComplete}
              className="flex-1"
            >
              {step === steps.length ? 'Go to Portal' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
