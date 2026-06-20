import { CreditCard } from "lucide-react"

export default function BillingPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Billing</h1>
        <p className="text-white/50 text-sm">Manage your subscription and payment methods</p>
      </div>

      <div className="space-y-6">
        {/* Current Plan */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Current Plan</h2>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400">Free</span>
          </div>
          <p className="text-sm text-white/50 mb-4">Upgrade to unlock unlimited downloads, creator tools, and priority support.</p>
          <button className="h-9 px-4 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors">
            Upgrade Plan
          </button>
        </div>

        {/* Payment Methods */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Payment Methods</h2>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06]">
            <CreditCard className="h-5 w-5 text-white/30" />
            <p className="text-sm text-white/50">No payment method on file</p>
          </div>
          <button className="mt-4 h-9 px-4 rounded-lg border border-white/[0.08] text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors">
            Add Payment Method
          </button>
        </div>

        {/* Invoices */}
        <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white mb-4">Invoices</h2>
          <p className="text-sm text-white/30">No invoices yet.</p>
        </div>
      </div>
    </div>
  )
}
