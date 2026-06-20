import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/server"

async function getSiteSettings() {
  try {
    const supabase = await createClient()
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .single()
    
    if (error) {
      console.error('Error fetching site settings:', error)
      return null
    }
    
    return settings
  } catch (error) {
    console.error('Error in getSiteSettings:', error)
    return null
  }
}

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Platform Settings</h1>
            <p className="text-xl text-text-secondary">Configure platform settings</p>
          </div>

          <Card className="glass mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Site Settings</CardTitle>
              <CardDescription className="text-text-secondary">General platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName" className="text-text-secondary">Site Name</Label>
                <Input id="siteName" defaultValue={settings?.site_name || 'MidasAI'} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="siteDescription" className="text-text-secondary">Site Description</Label>
                <Input id="siteDescription" defaultValue={settings?.site_description || ''} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="contactEmail" className="text-text-secondary">Contact Email</Label>
                <Input id="contactEmail" type="email" defaultValue={settings?.contact_email || ''} className="mt-1" />
              </div>
              <Button className="shadow-glow">Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="glass mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Pricing Settings</CardTitle>
              <CardDescription className="text-text-secondary">Platform fee configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="platformFee" className="text-text-secondary">Platform Fee (%)</Label>
                <Input id="platformFee" type="number" defaultValue={settings?.platform_fee || 15} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="minPayout" className="text-text-secondary">Minimum Payout ($)</Label>
                <Input id="minPayout" type="number" defaultValue={settings?.minimum_payout || 50} className="mt-1" />
              </div>
              <Button className="shadow-glow">Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Maintenance Mode</CardTitle>
              <CardDescription className="text-text-secondary">Temporarily disable the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div>
                  <p className="font-medium text-text-primary">Enable Maintenance Mode</p>
                  <p className="text-sm text-text-tertiary">Disable access to the platform for all users</p>
                </div>
                <Button variant={settings?.maintenance_mode ? 'default' : 'outline'} className="transition-smooth">
                  {settings?.maintenance_mode ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
