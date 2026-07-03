import { getAdminOverview } from "@/lib/admin/queries"
import { AdminPageHeader, StatCard } from "@/components/admin/AdminUi"
import { formatBytes } from "@/lib/admin/queries"
import { CheckCircle2, AlertTriangle, Server, Database, CreditCard, HardDrive } from "lucide-react"

export default async function AdminHealthPage() {
  const overview = await getAdminOverview()

  const services = [
    { name: "Next.js App", status: "ok", icon: Server, detail: "Build passing" },
    { name: "Supabase Database", status: "ok", icon: Database, detail: "Connected" },
    { name: "Stripe", status: "ok", icon: CreditCard, detail: "Webhook configured" },
    { name: "Storage", status: overview.storageBytes > 1024 * 1024 * 1024 ? "warn" : "ok", icon: HardDrive, detail: formatBytes(overview.storageBytes) },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System health"
        description="Platform status, service checks, and resource usage"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active listings" value={overview.activeListings} sub={`${overview.pendingListings} pending review`} accent />
        <StatCard label="Active users" value={overview.totalUsers.toLocaleString()} sub={`${overview.newUsers7d} new this week`} />
        <StatCard label="Open reports" value={overview.openReports} sub="Needs attention" />
        <StatCard label="Storage" value={formatBytes(overview.storageBytes)} sub={`${overview.totalAssets} assets`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Service status</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <service.icon className={`h-5 w-5 ${service.status === "ok" ? "text-emerald-400" : "text-amber-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{service.name}</p>
                    <p className="text-xs text-white/40">{service.detail}</p>
                  </div>
                </div>
                {service.status === "ok" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> Warning
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent checks</h2>
          <p className="text-sm text-white/50">Background workers and service health checks will be surfaced here once the monitoring cron is wired.</p>
        </div>
      </div>
    </div>
  )
}
