import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Upload, FolderOpen, Sparkles } from "lucide-react"

export default function CreatorUploadPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Upload Listing</h1>
            <p className="text-xl text-text-secondary">Create a new listing for the marketplace with AI-powered analysis</p>
          </div>

          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">GitHub Repository</CardTitle>
                <CardDescription className="text-text-secondary">Paste a GitHub URL to automatically analyze and import your repository</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="github-url">GitHub Repository URL</Label>
                  <Input 
                    id="github-url" 
                    placeholder="https://github.com/username/repository" 
                  />
                </div>
                <div className="p-4 bg-surface rounded-xl">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-cta mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-text-primary">AI-Powered Analysis</p>
                      <p className="text-xs text-text-tertiary">We'll automatically clone your repository, analyze the code, extract documentation, detect technologies, and generate optimized listing metadata.</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full transition-smooth">
                  <Github className="h-4 w-4 mr-2" />
                  Analyze Repository
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">ZIP Upload</CardTitle>
                <CardDescription className="text-text-secondary">Upload a ZIP file containing your project files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="zip-file">ZIP File</Label>
                  <Input id="zip-file" type="file" accept=".zip" />
                </div>
                <div className="p-4 bg-surface rounded-xl">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-cta mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-text-primary">AI-Powered Analysis</p>
                      <p className="text-xs text-text-tertiary">We'll extract the ZIP, scan all files, analyze the structure, and generate optimized listing metadata.</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full transition-smooth">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Analyze
                </Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl text-text-primary">Local Files</CardTitle>
                <CardDescription className="text-text-secondary">Upload files or directories from your local machine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="local-files">Files or Directory</Label>
                  <Input id="local-files" type="file" multiple />
                </div>
                <div className="p-4 bg-surface rounded-xl">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-cta mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-text-primary">AI-Powered Analysis</p>
                      <p className="text-xs text-text-tertiary">We'll scan your files, analyze the structure, and generate optimized listing metadata.</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full transition-smooth">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Upload & Analyze
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="glass mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Listing Details</CardTitle>
              <CardDescription className="text-text-secondary">Review and edit the AI-generated listing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="AI-generated title will appear here" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[120px] w-full rounded-lg border bg-surface px-4 py-2 text-sm text-text-primary ring-offset-background placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                  placeholder="AI-generated description will appear here"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    className="flex h-10 w-full rounded-lg border bg-surface px-4 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                  >
                    <option value="">Select type</option>
                    <option value="SKILL">Claude Skill</option>
                    <option value="CURSOR_RULE">Cursor Rule</option>
                    <option value="MCP">MCP Server</option>
                    <option value="AGENT">AI Agent</option>
                    <option value="PROMPT_PACK">Prompt Pack</option>
                    <option value="WORKFLOW">Workflow</option>
                    <option value="TEMPLATE">Template</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-lg border bg-surface px-4 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                  >
                    <option value="">Select category</option>
                    <option value="productivity">Productivity</option>
                    <option value="automation">Automation</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="research">Research</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" type="number" placeholder="29" />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input id="tags" placeholder="AI-generated tags will appear here" />
              </div>
              <div>
                <Label htmlFor="images">Images</Label>
                <Input id="images" type="file" accept="image/*" multiple />
              </div>
              <Button className="w-full shadow-glow transition-smooth">Create Listing</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
