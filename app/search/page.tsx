import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Search</h1>
        
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for skills, plugins, agents..."
              className="h-12 pl-12 text-lg"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline">All Types</Button>
            <Button variant="outline">Claude Skills</Button>
            <Button variant="outline">Cursor Rules</Button>
            <Button variant="outline">MCP Servers</Button>
            <Button variant="outline">AI Agents</Button>
            <Button variant="outline">Workflows</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>AI Tool {i}</CardTitle>
                <CardDescription>Powerful automation for your workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">$29</span>
                  <Button>View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
