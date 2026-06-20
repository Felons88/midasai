"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Upload, BarChart, DollarSign, ArrowRight } from "lucide-react"

interface CreatorOnboardingProps {
  onComplete?: () => void
}

export function CreatorOnboarding({ onComplete }: CreatorOnboardingProps) {
  const [step, setStep] = useState(1)
  const router = useRouter()

  const steps = [
    {
      title: "Welcome to Creator Studio",
      description: "Turn your AI tools into revenue by listing them on MidasAI marketplace",
      icon: Sparkles,
    },
    {
      title: "Connect Your GitHub",
      description: "Link your GitHub account to easily import and manage your repositories",
      icon: Upload,
    },
    {
      title: "Set Up Your Profile",
      description: "Create your creator profile and configure your payment settings",
      icon: BarChart,
    },
    {
      title: "Upload Your First Asset",
      description: "Import your first AI tool and start earning from your work",
      icon: DollarSign,
    },
  ]

  const handleStepComplete = () => {
    if (step < steps.length) {
      setStep(step + 1)
    } else {
      onComplete?.()
      router.push('/creator/dashboard')
    }
  }

  const handleSkip = () => {
    onComplete?.()
    router.push('/creator/dashboard')
  }

  const CurrentIcon = steps[step - 1].icon

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cta to-cta-light flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold">Creator Studio</span>
            </div>
            <span className="text-sm text-text-tertiary">
              Step {step} of {steps.length}
            </span>
          </div>
          <CardTitle className="text-2xl">{steps[step - 1].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-6 bg-surface rounded-lg">
            <div className="h-12 w-12 rounded-lg bg-cta/20 flex items-center justify-center">
              <CurrentIcon className="h-6 w-6 text-cta" />
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
                    index < step ? 'bg-cta' : 'bg-white/10'
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
              {step === steps.length ? 'Go to Dashboard' : 'Continue'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
