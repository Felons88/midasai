import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Download, Clock, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

async function getRevenueData(userId: string) {
  try {
    const supabase = await createClient()
    
    // Get all transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount, status, created_at, platform_fee')
      .eq('creator_id', userId)
    
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }
    
    const completedTransactions = transactions?.filter((t: any) => t.status === 'COMPLETED') || []
    const refundedTransactions = transactions?.filter((t: any) => t.status === 'REFUNDED') || []
    
    // Calculate gross revenue (total sales before platform fees)
    const grossRevenue = completedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    
    // Calculate platform fees
    const platformFees = completedTransactions.reduce((sum: number, t: any) => sum + (t.platform_fee || 0), 0)
    
    // Calculate net revenue (gross - platform fees - refunds)
    const refunds = refundedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    const netRevenue = grossRevenue - platformFees - refunds
    
    // Get pending payouts (transactions that are completed but not yet paid out)
    const { data: payouts, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })
    
    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError)
    }
    
    const pendingPayouts = payouts?.filter((p: any) => p.status === 'PENDING') || []
    const completedPayouts = payouts?.filter((p: any) => p.status === 'COMPLETED') || []
    
    const pendingAmount = pendingPayouts.reduce((sum: number, p: any) => sum + p.amount, 0)
    const completedAmount = completedPayouts.reduce((sum: number, p: any) => sum + p.amount, 0)
    
    return {
      grossRevenue,
      platformFees,
      netRevenue,
      refunds,
      pendingPayouts,
      completedPayouts,
      pendingAmount,
      completedAmount
    }
  } catch (error) {
    console.error('Error in getRevenueData:', error)
    return {
      grossRevenue: 0,
      platformFees: 0,
      netRevenue: 0,
      refunds: 0,
      pendingPayouts: [],
      completedPayouts: [],
      pendingAmount: 0,
      completedAmount: 0
    }
  }
}

export default async function CreatorPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
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
  
  const data = await getRevenueData(user.id)
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />
      
      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 text-text-primary">Revenue & Payouts</h1>
          <p className="text-xl text-text-secondary">Track your earnings and payout status</p>
        </div>

        <div className="bento-grid mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Gross Revenue</CardTitle>
              <CardTitle className="text-4xl text-text-primary">${data.grossRevenue}</CardTitle>
              <CardDescription className="text-xs text-text-secondary">Total sales before fees</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Platform Fees</CardTitle>
              <CardTitle className="text-4xl text-text-primary">${data.platformFees}</CardTitle>
              <CardDescription className="text-xs text-accent-red">Platform commission</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Net Revenue</CardTitle>
              <CardTitle className="text-4xl text-cta">${data.netRevenue}</CardTitle>
              <CardDescription className="text-xs text-cta">Your earnings</CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass hover:shadow-glow transition-smooth">
            <CardHeader className="pb-3 space-y-2">
              <CardTitle className="text-sm font-medium text-text-tertiary">Refunds</CardTitle>
              <CardTitle className="text-4xl text-text-primary">${data.refunds}</CardTitle>
              <CardDescription className="text-xs text-text-secondary">Total refunds</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
                      <p className="font-semibold text-text-primary">${data.pendingAmount}</p>
                      <p className="text-sm text-text-tertiary">Total pending</p>
                    </div>
                  </div>
                </div>
                {data.pendingPayouts.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-medium text-text-primary">${payout.amount}</p>
                      <p className="text-sm text-text-tertiary">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs bg-surface text-cta px-3 py-1 rounded-full border">Pending</span>
                  </div>
                ))}
                {data.pendingPayouts.length === 0 && (
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
                      <p className="font-semibold text-text-primary">${data.completedAmount}</p>
                      <p className="text-sm text-text-tertiary">Total paid out</p>
                    </div>
                  </div>
                </div>
                {data.completedPayouts.map((payout: any) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 bg-surface rounded-xl">
                    <div>
                      <p className="font-medium text-text-primary">${payout.amount}</p>
                      <p className="text-sm text-text-tertiary">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs bg-surface text-cta px-3 py-1 rounded-full border">Completed</span>
                  </div>
                ))}
                {data.completedPayouts.length === 0 && (
                  <p className="text-sm text-text-tertiary">No completed payouts yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="text-2xl text-text-primary">Payout Settings</CardTitle>
            <CardDescription className="text-text-secondary">Configure your payout preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-surface rounded-xl">
                <p className="font-medium text-text-primary mb-2">Payout Method</p>
                <p className="text-sm text-text-tertiary mb-4">Configure your Stripe account for automatic payouts</p>
                <Button className="w-full transition-smooth">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Connect Stripe Account
                </Button>
              </div>
              <div className="p-4 bg-surface rounded-xl">
                <p className="font-medium text-text-primary mb-2">Payout Schedule</p>
                <p className="text-sm text-text-tertiary mb-4">Payouts are processed monthly on the 1st</p>
                <Button variant="outline" className="w-full transition-smooth">
                  <Download className="mr-2 h-4 w-4" />
                  Download Payout History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
