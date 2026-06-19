import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Filter, MoreVertical, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminListingsPage() {
  const listings = [
    { id: 1, title: "Claude Skill Pack Pro", type: "Claude Skills", creator: "John Doe", price: 29, status: "Active", created: "2024-01-15" },
    { id: 2, title: "Cursor Rules for React", type: "Cursor Rules", creator: "Jane Smith", price: 19, status: "Pending", created: "2024-01-14" },
    { id: 3, title: "MCP Server Template", type: "MCP Servers", creator: "Bob Wilson", price: 49, status: "Pending", created: "2024-01-13" },
    { id: 4, title: "AI Agent Builder", type: "AI Agents", creator: "Alice Brown", price: 99, status: "Active", created: "2024-01-12" },
    { id: 5, title: "Prompt Pack Pro", type: "Prompt Packs", creator: "Charlie Davis", price: 15, status: "Rejected", created: "2024-01-11" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Listings</h1>
        <p className="text-muted-foreground">Manage marketplace listings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Listings</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search listings..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Listing</th>
                <th className="text-left p-4 font-medium">Type</th>
                <th className="text-left p-4 font-medium">Creator</th>
                <th className="text-left p-4 font-medium">Price</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{listing.title}</td>
                  <td className="p-4">{listing.type}</td>
                  <td className="p-4">{listing.creator}</td>
                  <td className="p-4">${listing.price}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        listing.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : listing.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="p-4">{listing.created}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {listing.status === "Pending" && (
                        <>
                          <Button variant="outline" size="icon">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
