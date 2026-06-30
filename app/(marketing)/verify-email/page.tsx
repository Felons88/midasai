'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage('Your email has been successfully verified!')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to verify email')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred while verifying your email')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-md mx-auto">
          <Card className="glass">
            <CardHeader className="text-center">
              {status === 'loading' && (
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
              )}
              
              {status === 'success' && (
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              )}
              
              {status === 'error' && (
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
              )}
              
              <CardTitle className="text-2xl text-text-primary">
                {status === 'loading' ? 'Verifying Email...' : status === 'success' ? 'Email Verified' : 'Verification Failed'}
              </CardTitle>
              <CardDescription className="text-text-secondary">
                {message}
              </CardDescription>
            </CardHeader>
            
            {status === 'success' && (
              <CardContent className="text-center">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            )}
            
            {status === 'error' && (
              <CardContent className="text-center">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  className="border-white/[0.2] text-white hover:bg-white/[0.1]"
                >
                  Return to Dashboard
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
