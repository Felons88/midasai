import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Settings</h1>
            <p className="text-xl text-text-secondary">Manage your account settings</p>
          </div>

          <Card className="glass mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Account Settings</CardTitle>
              <CardDescription className="text-text-secondary">Update your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-text-secondary">Email</Label>
                <Input id="email" type="email" defaultValue={user.email || ''} className="mt-1" disabled />
              </div>
              <p className="text-sm text-text-tertiary">Contact support to change your email address.</p>
            </CardContent>
          </Card>

          <Card className="glass mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Change Password</CardTitle>
              <CardDescription className="text-text-secondary">Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-text-secondary">Current Password</Label>
                <Input id="currentPassword" type="password" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-text-secondary">New Password</Label>
                <Input id="newPassword" type="password" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-text-secondary">Confirm Password</Label>
                <Input id="confirmPassword" type="password" className="mt-1" />
              </div>
              <Button className="shadow-glow">Change Password</Button>
            </CardContent>
          </Card>

          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-red-400">Danger Zone</CardTitle>
              <CardDescription className="text-text-secondary">Permanently delete your account</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-tertiary mb-4">
                Once you delete your account, there is no going back. All your data, listings, and history will be permanently removed.
              </p>
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
