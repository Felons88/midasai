import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreatorAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Track your listing performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            <CardTitle className="text-3xl">12.4k</CardTitle>
            <CardDescription className="text-xs text-green-600">+12.5% from last month</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <CardTitle className="text-3xl">156</CardTitle>
            <CardDescription className="text-xs text-green-600">+8.2% from last month</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <CardTitle className="text-3xl">1.26%</CardTitle>
            <CardDescription className="text-xs text-green-600">+0.3% from last month</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Rating</CardTitle>
            <CardTitle className="text-3xl">4.8</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Based on 42 reviews</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Listing</CardTitle>
            <CardDescription>Top performing listings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "AI Agent Builder", sales: 78, revenue: 7722 },
                { name: "Claude Skill Pack Pro", sales: 45, revenue: 1305 },
                { name: "Cursor Rules for React", sales: 32, revenue: 608 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-medium">{item.name}</span>
                  <div className="text-right">
                    <p className="font-semibold">{item.sales} sales</p>
                    <p className="text-sm text-muted-foreground">${item.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest views and purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Purchase", item: "AI Agent Builder", time: "2 hours ago" },
                { action: "View", item: "Claude Skill Pack Pro", time: "3 hours ago" },
                { action: "Purchase", item: "Cursor Rules for React", time: "5 hours ago" },
                { action: "View", item: "MCP Server Template", time: "6 hours ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{activity.action}</span>
                    <span className="text-muted-foreground"> - {activity.item}</span>
                  </div>
                  <span className="text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
