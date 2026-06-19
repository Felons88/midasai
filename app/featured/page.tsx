import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

export default function FeaturedPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-4xl font-bold">Featured</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Hand-picked tools by our team
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="hover:shadow-lg transition-shadow border-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Featured Tool {i}</CardTitle>
                  <CardDescription>Editor's choice</CardDescription>
                </div>
                <Star className="h-5 w-5 text-primary fill-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">$39</span>
                <Button>View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
