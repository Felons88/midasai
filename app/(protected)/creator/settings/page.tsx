'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function CreatorSettingsPage() {
  const [verificationStatus, setVerificationStatus] = useState<'PENDING' | 'REVIEW' | 'VERIFIED'>('PENDING')
  const [chargesEnabled, setChargesEnabled] = useState(false)
  const [payoutsEnabled, setPayoutsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkVerificationStatus()
  }, [])

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect/status')
      const data = await response.json()
      
      setVerificationStatus(data.status)
      setChargesEnabled(data.charges_enabled)
      setPayoutsEnabled(data.payouts_enabled)
    } catch (error) {
      console.error('Error checking verification status:', error)
    } finally {
      setLoading(false)
    }
  }

  const startOnboarding = async () => {
    setOnboardingLoading(true)
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
      })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error starting onboarding:', error)
    } finally {
      setOnboardingLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'VERIFIED':
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case 'REVIEW':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Verified
          </Badge>
        )
    }
  }

  const getStatusDescription = () => {
    switch (verificationStatus) {
      case 'VERIFIED':
        return 'Your account is verified and ready to receive payouts. You can now sell your creations on the marketplace.'
      case 'REVIEW':
        return 'Your verification is under review. Stripe is processing your information. This usually takes 1-2 business days.'
      default:
        return 'Complete Stripe Connect verification to enable payouts and sell your creations on the marketplace.'
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-text-primary">Creator Settings</h1>
            <p className="text-text-secondary">Manage your creator account and verification status</p>
          </div>

          {/* Verification Status Card */}
          <Card className="glass mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-text-primary">Stripe Connect Verification</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Verify your account to enable payouts and sell on the marketplace
                  </CardDescription>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-text-secondary mb-4">{getStatusDescription()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${chargesEnabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {chargesEnabled ? <CheckCircle className="h-5 w-5 text-green-400" /> : <AlertCircle className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Charges Enabled</p>
                    <p className="text-sm text-text-secondary">Accept payments</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.08]">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${payoutsEnabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {payoutsEnabled ? <CheckCircle className="h-5 w-5 text-green-400" /> : <AlertCircle className="h-5 w-5 text-gray-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Payouts Enabled</p>
                    <p className="text-sm text-text-secondary">Receive earnings</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {verificationStatus !== 'VERIFIED' && (
                  <Button
                    onClick={startOnboarding}
                    disabled={onboardingLoading || verificationStatus === 'REVIEW'}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {onboardingLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : verificationStatus === 'REVIEW' ? (
                      'Verification in Progress'
                    ) : (
                      'Start Verification'
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={checkVerificationStatus}
                  disabled={loading}
                  className="border-white/[0.2] text-white hover:bg-white/[0.1]"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-xl text-text-primary">About Stripe Connect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-text-secondary space-y-2">
                <p>Stripe Connect is our payment processing partner that handles:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Secure payment processing</li>
                  <li>Automatic payouts to your bank account</li>
                  <li>Tax reporting and compliance</li>
                  <li>Fraud protection</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-white/[0.08]">
                <Button variant="link" asChild className="text-blue-400 hover:text-blue-300 p-0">
                  <a href="https://stripe.com/connect" target="_blank" rel="noopener noreferrer">
                    Learn more about Stripe Connect
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
