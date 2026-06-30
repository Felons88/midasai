import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Star, Plus, ArrowRight } from "lucide-react"

export default async function CreatorDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: listings }, { data: downloads }] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, price, downloads, average_rating, review_count, status, updated_at")
      .eq("creator_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("downloads")
      .select("id", { count: "exact" })
      .eq("listing_id", user.id),
  ])

  const products = listings ?? []
  const totalDownloads = products.reduce((sum, p) => sum + (p.downloads ?? 0), 0)
  const totalRevenue = products.reduce((sum, p) => sum + (Number(p.price) ?? 0) * (p.downloads ?? 0), 0)
  const avgRating =
    products.length > 0
      ? products.reduce((sum, p) => sum + (Number(p.average_rating) || 0), 0) / products.length
      : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Creator Dashboard</h1>
          <p className="text-text-secondary mt-1">Manage your products and track performance.</p>
        </div>
        <Link href="/creator/upload">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Upload New Product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Total Downloads" value={totalDownloads} />
        <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <StatCard label="Avg Rating" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Products</CardTitle>
          <Link href="/creator/listings">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No products yet.</p>
              <Link href="/creator/upload">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Upload your first product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-text-primary truncate">{product.title}</h3>
                      <Badge variant={product.price > 0 ? "default" : "secondary"}>
                        {product.price > 0 ? `$${product.price}` : "Free"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-text-tertiary">
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>{product.downloads ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{product.average_rating ? Number(product.average_rating).toFixed(1) : "—"}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {product.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-text-tertiary">{label}</p>
        <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}
