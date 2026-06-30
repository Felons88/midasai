import Link from "next/link"
import { AlertTriangle, ExternalLink } from "lucide-react"
import type { StripeSetupStatus } from "@/lib/stripe/config"

export function StripeSetupBanner({ status }: { status: StripeSetupStatus }) {
  if (status.readyForCheckout) return null

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-amber-200">Stripe billing is not fully configured</h3>
          <p className="text-xs text-amber-200/70 mt-1">
            Checkout and upgrades need API keys and price IDs in your environment. Add the missing
            variables below, then restart <code className="text-amber-100/80">npm run dev</code>.
          </p>
          <ul className="mt-2 space-y-1">
            {status.missing.map((item) => (
              <li key={item} className="text-xs font-mono text-amber-100/80">
                • {item}
              </li>
            ))}
          </ul>
          <a
            href="https://dashboard.stripe.com/apikeys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-amber-300 hover:text-amber-200"
          >
            Open Stripe API keys <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-[11px] text-white/40 mt-2">
            Local webhooks:{" "}
            <code className="text-white/50">stripe listen --forward-to localhost:3000/api/stripe/webhook</code>
          </p>
        </div>
      </div>
    </div>
  )
}
