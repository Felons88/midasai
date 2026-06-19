import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Settings</h1>
          <p className="text-muted-foreground">Configure platform settings</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
            <CardDescription>General platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input id="siteName" defaultValue="MidasAI" />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input id="siteDescription" defaultValue="The premier marketplace for AI tools" />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" type="email" defaultValue="hello@midasai.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pricing Settings</CardTitle>
            <CardDescription>Platform fee configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platformFee">Platform Fee (%)</Label>
              <Input id="platformFee" type="number" defaultValue="15" />
            </div>
            <div>
              <Label htmlFor="minPayout">Minimum Payout ($)</Label>
              <Input id="minPayout" type="number" defaultValue="50" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
            <CardDescription>Temporarily disable the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">Disable access to the platform</p>
              </div>
              <Button variant="outline">Toggle</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
