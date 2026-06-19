import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CollectionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Collections</h1>
        <p className="text-muted-foreground text-lg">
          Curated collections of AI tools and resources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Collection {i}</CardTitle>
              <CardDescription>A curated set of 10+ tools for specific use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">12 items</span>
                <Button>View Collection</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
