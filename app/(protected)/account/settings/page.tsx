'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AlertTriangle, Bell, Mail, User, Shield, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AccountSettingsPage() {
  const supabase = createBrowserSupabaseClient()
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  const handleDeleteAccount = async () => {
    if (!confirm('This will permanently delete your account and all data. Are you absolutely sure?')) return
    
    setLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
    } finally {
      setLoading(false)
    }
  }

  const settingsSections = [
    {
      title: 'Profile',
      description: 'Manage your personal information',
      icon: User,
      href: '/account/profile',
      color: 'text-blue-400'
    },
    {
      title: 'Security',
      description: 'Password, 2FA, and login settings',
      icon: Shield,
      href: '/account/security',
      color: 'text-green-400'
    },
    {
      title: 'Notifications',
      description: 'Email and push notification preferences',
      icon: Bell,
      href: '/account/notifications',
      color: 'text-amber-400'
    },
    {
      title: 'Billing',
      description: 'Payment methods and subscription',
      icon: CreditCard,
      href: '/account/billing',
      color: 'text-purple-400'
    },
    {
      title: 'API Keys',
      description: 'Manage your API keys and access',
      icon: Mail,
      href: '/account/api-keys',
      color: 'text-red-400'
    }
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Account Settings</h1>
        <p className="text-white/50 text-sm">Manage your account preferences and configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
              <CardHeader className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <section.icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <CardTitle className="text-xl text-white">{section.title}</CardTitle>
                <CardDescription className="text-sm text-white/50">{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="space-y-6">
        {/* Notification Preferences */}
        <Card className="border border-white/[0.06] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-lg text-white">Quick Notification Settings</CardTitle>
            <CardDescription className="text-sm text-white/50">Common notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Email notifications', desc: 'Receive updates about your purchases' },
                { label: 'Marketing emails', desc: 'Receive news about new features and listings' },
                { label: 'Creator updates', desc: 'Get notified when creators you follow post' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-white">{item.label}</p>
                    <p className="text-[11px] text-white/30">{item.desc}</p>
                  </div>
                  <div className="h-5 w-9 rounded-full bg-amber-500/20 relative cursor-pointer">
                    <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-amber-400 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border border-red-500/20 bg-red-500/[0.02]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <CardTitle className="text-lg text-red-400">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-sm text-white/40">
              Permanently delete your account and all associated data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
