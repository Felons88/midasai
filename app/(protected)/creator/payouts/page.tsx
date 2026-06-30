import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Download, Clock, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import {
  fetchCreatorPayouts,
  fetchCreatorTransactions,
  summarizeTransactions,
} from "@/lib/creator/revenue"
import { StripeConnectButton } from "@/components/creator/StripeConnectButton"
import Link from "next/link"

export default async function CreatorPayoutsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="ambient-glow" />
        <div className="container mx-auto px-4 py-24 relative">
          <p className="text-xl text-text-secondary text-center">Please log in to view your payouts.</p>
        </div>
      </div>
    )
  }

  const transactions = await fetchCreatorTransactions(supabase, user.id)
  const summary = summarizeTransactions(transactions)
  const payouts = await fetchCreatorPayouts(supabase, user.id)

  const pendingPayouts = payouts.filter((p) => p.status === "PENDING")
  const completedPayouts = payouts.filter((p) => p.status === "COMPLETED")
  const pendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0)
  const completedAmount = completedPayouts.reduce((sum, p) => sum + Number(p.amount), 0)

  const formatMoney = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Revenue & Payouts</h1>
          <p className="text-xl text-text-secondary">Track your earnings and payout status</p>
        </div>

        <div className="bento-grid mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Gross Revenue</CardTitle>
              <CardTitle className="text-4xl text-text-primary">${formatMoney(summary.grossRevenue)}</CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                {summary.completedCount} completed sales
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Platform Fees</CardTitle>
              <CardTitle className="text-4xl text-text-primary">${formatMoney(summary.platformFees)}</CardTitle>
              <CardDescription className="text-xs text-accent-red">Platform commission</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Net Revenue</CardTitle>
              <CardTitle className="text-4xl text-cta">${formatMoney(summary.netRevenue)}</CardTitle>
              <CardDescription className="text-xs text-cta">Your earnings after fees</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Refunds</CardTitle>
              <CardTitle className="text-4xl text-text-primary">${formatMoney(summary.refunds)}</CardTitle>
              <CardDescription className="text-xs text-text-secondary">Total refunded</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Pending Payouts</CardTitle>
              <CardDescription className="text-text-secondary">Awaiting processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-cta" />
                    <div>
                      <p className="font-semibold text-text-primary">${formatMoney(pendingAmount)}</p>
                      <p className="text-sm text-text-tertiary">Total pending</p>
                    </div>
                  </div>
                </div>
                {pendingPayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 bg-surface rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-text-primary">${formatMoney(Number(payout.amount))}</p>
                      <p className="text-sm text-text-tertiary">
                        {payout.created_at
                          ? new Date(payout.created_at).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <span className="text-xs bg-surface text-cta px-3 py-1 rounded-full border">
                      Pending
                    </span>
                  </div>
                ))}
                {pendingPayouts.length === 0 && (
                  <p className="text-sm text-text-tertiary">No pending payouts.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-2xl text-text-primary">Completed Payouts</CardTitle>
              <CardDescription className="text-text-secondary">Successfully transferred</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-cta" />
                    <div>
                      <p className="font-semibold text-text-primary">${formatMoney(completedAmount)}</p>
                      <p className="text-sm text-text-tertiary">Total paid out</p>
                    </div>
                  </div>
                </div>
                {completedPayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 bg-surface rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-text-primary">${formatMoney(Number(payout.amount))}</p>
                      <p className="text-sm text-text-tertiary">
                        {payout.created_at
                          ? new Date(payout.created_at).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <span className="text-xs bg-surface text-cta px-3 py-1 rounded-full border">
                      Completed
                    </span>
                  </div>
                ))}
                {completedPayouts.length === 0 && (
                  <p className="text-sm text-text-tertiary">No completed payouts yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <CardHeader>
            <CardTitle className="text-2xl text-text-primary">Payout Settings</CardTitle>
            <CardDescription className="text-text-secondary">
              Connect Stripe to receive automatic payouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-surface rounded-xl">
                <p className="font-medium text-text-primary mb-2">Payout Method</p>
                <p className="text-sm text-text-tertiary mb-4">
                  Connect your Stripe Express account to receive marketplace earnings
                </p>
                <StripeConnectButton />
              </div>
              <div className="p-4 bg-surface rounded-xl">
                <p className="font-medium text-text-primary mb-2">Export</p>
                <p className="text-sm text-text-tertiary mb-4">
                  Download transaction history for your records
                </p>
                <Button variant="outline" className="w-full transition-smooth" asChild>
                  <Link href="/api/creator/payouts/export">
                    <Download className="mr-2 h-4 w-4" />
                    Download Payout History (CSV)
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
