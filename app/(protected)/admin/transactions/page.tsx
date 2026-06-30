import { getRecentTransactions } from "@/lib/admin/queries"
import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/AdminUi"
import { RefundTransactionButton } from "@/components/admin/RefundTransactionButton"

export default async function AdminTransactionsPage() {
  const transactions = await getRecentTransactions(100)

  return (
    <div>
      <AdminPageHeader
        title="Payments & transactions"
        description="All marketplace purchases, refunds, and Stripe payment intents"
      />

      <AdminTable headers={["Date", "Buyer", "Listing", "Amount", "Status", "Stripe", "Actions"]}>
        {transactions.map((tx) => (
          <tr key={tx.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3 text-xs text-white/50 whitespace-nowrap">
              {tx.created_at ? new Date(tx.created_at).toLocaleString() : "—"}
            </td>
            <td className="px-4 py-3 text-sm text-white/80">
              {(tx.user as { email?: string } | null)?.email ?? "—"}
            </td>
            <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate">
              {(tx.listing as { title?: string } | null)?.title ?? "—"}
            </td>
            <td className="px-4 py-3 text-amber-400 font-medium">${tx.amount}</td>
            <td className="px-4 py-3">
              <StatusBadge status={tx.status} />
            </td>
            <td className="px-4 py-3 text-xs text-white/30 font-mono max-w-[120px] truncate">
              {tx.stripe_payment_intent_id ?? "—"}
            </td>
            <td className="px-4 py-3">
              {tx.status === "COMPLETED" && <RefundTransactionButton transactionId={tx.id} />}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  )
}
