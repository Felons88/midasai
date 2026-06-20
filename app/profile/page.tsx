import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

async function getUserProfile(userId: string) {
  try {
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    
    return profile
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }
  
  const profile = await getUserProfile(user.id)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Profile</h1>
            <p className="text-xl text-text-secondary">Manage your personal information</p>
          </div>

          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Personal Information</CardTitle>
              <CardDescription className="text-text-secondary">Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-text-secondary">Name</Label>
                <Input id="name" defaultValue={profile?.name || ''} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email" className="text-text-secondary">Email</Label>
                <Input id="email" type="email" defaultValue={profile?.email || user.email || ''} className="mt-1" disabled />
              </div>
              <div>
                <Label htmlFor="bio" className="text-text-secondary">Bio</Label>
                <Input id="bio" defaultValue={profile?.bio || ''} placeholder="Tell us about yourself" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="avatar" className="text-text-secondary">Avatar URL</Label>
                <Input id="avatar" defaultValue={profile?.avatar_url || ''} placeholder="https://example.com/avatar.jpg" className="mt-1" />
              </div>
              <Button className="shadow-glow">Save Changes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
