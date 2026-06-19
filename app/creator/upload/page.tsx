import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreatorUploadPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Upload Listing</h1>
          <p className="text-muted-foreground">Create a new listing for the marketplace</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
            <CardDescription>Fill in the information about your listing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Enter listing title" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe your listing"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select type</option>
                <option value="skill">Claude Skill</option>
                <option value="plugin">Cursor Rule</option>
                <option value="mcp">MCP Server</option>
                <option value="agent">AI Agent</option>
                <option value="prompt">Prompt Pack</option>
                <option value="workflow">Workflow</option>
                <option value="template">Template</option>
              </select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select category</option>
                <option value="productivity">Productivity</option>
                <option value="automation">Automation</option>
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" placeholder="29" />
            </div>
            <div>
              <Label htmlFor="files">Files</Label>
              <Input id="files" type="file" multiple />
            </div>
            <div>
              <Label htmlFor="images">Images</Label>
              <Input id="images" type="file" accept="image/*" multiple />
            </div>
            <Button className="w-full">Create Listing</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
