import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"

export default function CreatorListingsPage() {
  const listings = [
    {
      id: 1,
      title: "Claude Skill Pack Pro",
      type: "Claude Skills",
      price: 29,
      status: "Active",
      views: 1234,
      sales: 45,
      revenue: 1305,
    },
    {
      id: 2,
      title: "Cursor Rules for React",
      type: "Cursor Rules",
      price: 19,
      status: "Active",
      views: 856,
      sales: 32,
      revenue: 608,
    },
    {
      id: 3,
      title: "MCP Server Template",
      type: "MCP Servers",
      price: 49,
      status: "Pending",
      views: 0,
      sales: 0,
      revenue: 0,
    },
    {
      id: 4,
      title: "AI Agent Builder",
      type: "AI Agents",
      price: 99,
      status: "Active",
      views: 2341,
      sales: 78,
      revenue: 7722,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Listings</h1>
          <p className="text-muted-foreground">Manage your marketplace listings</p>
        </div>
        <Button>Create New Listing</Button>
      </div>

      <div className="space-y-4">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{listing.title}</CardTitle>
                  <CardDescription>{listing.type} • ${listing.price}</CardDescription>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    listing.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {listing.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span>{listing.views} views</span>
                  <span>{listing.sales} sales</span>
                  <span className="font-semibold text-green-600">${listing.revenue} revenue</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
