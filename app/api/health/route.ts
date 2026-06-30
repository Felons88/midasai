import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"

type CheckKey =
  | "supabase"
  | "serviceRole"
  | "stripe"
  | "stripePrices"
  | "adminAlias"
  | "e2e"

const HINTS: Record<CheckKey, string> = {
  supabase: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  serviceRole: "Set SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API)",
  stripe:
    "Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  stripePrices: "Set STRIPE_PRO_PRICE_ID and STRIPE_ENTERPRISE_PRICE_ID in Stripe",
  adminAlias: "Set NEXT_PUBLIC_ADMIN_ROUTE_PREFIX (non-/admin path recommended)",
  e2e: "Optional: set E2E_TEST_EMAIL, E2E_TEST_PASSWORD, E2E_FREE_LISTING_ID for CI",
}

function isAuthorizedDiagnostics(request: NextRequest): boolean {
  const secret =
    process.env.HEALTH_CHECK_SECRET?.trim() ||
    process.env.ADMIN_SECRET_ROUTE?.trim()
  if (!secret) return false

  const headerSecret =
    request.headers.get("x-health-secret")?.trim() ||
    request.headers.get("x-admin-secret")?.trim()
  if (headerSecret === secret) return true

  const authorization = request.headers.get("authorization")?.trim()
  if (authorization === `Bearer ${secret}`) return true

  return false
}

function buildChecks() {
  const stripeDetails = {
    secretKey: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    publishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  }

  const checks = {
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripe:
      stripeDetails.secretKey &&
      stripeDetails.webhookSecret &&
      stripeDetails.publishableKey,
    stripePrices: Boolean(
      process.env.STRIPE_PRO_PRICE_ID && process.env.STRIPE_ENTERPRISE_PRICE_ID
    ),
    adminAlias: Boolean(process.env.NEXT_PUBLIC_ADMIN_ROUTE_PREFIX),
    e2e: Boolean(
      process.env.E2E_TEST_EMAIL &&
        process.env.E2E_TEST_PASSWORD &&
        process.env.E2E_FREE_LISTING_ID
    ),
  }

  return { checks, stripeDetails }
}

export async function GET(request: NextRequest) {
  const { checks } = buildChecks()
  const timestamp = new Date().toISOString()

  if (!isAuthorizedDiagnostics(request)) {
    return NextResponse.json({
      status: checks.supabase ? "ok" : "degraded",
      timestamp,
    })
  }

  const { stripeDetails } = buildChecks()

  const missing = (Object.entries(checks) as [CheckKey, boolean][])
    .filter(([, ok]) => !ok)
    .map(([key]) => key)

  const hints = Object.fromEntries(
    missing.map((key) => [key, HINTS[key]])
  ) as Partial<Record<CheckKey, string>>

  const stripeMissing: string[] = []
  if (!stripeDetails.secretKey) stripeMissing.push("STRIPE_SECRET_KEY")
  if (!stripeDetails.webhookSecret) stripeMissing.push("STRIPE_WEBHOOK_SECRET")
  if (!stripeDetails.publishableKey) stripeMissing.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")

  const launchReady =
    checks.supabase && checks.serviceRole && checks.stripe && checks.stripePrices

  let stripeLive: boolean | null = null
  if (checks.stripe) {
    try {
      const stripe = getStripe()
      if (stripe) {
        await stripe.balance.retrieve()
        stripeLive = true
      }
    } catch {
      stripeLive = false
    }
  }

  let status: "degraded" | "ok" | "launch_ready" = checks.supabase ? "ok" : "degraded"
  if (launchReady && stripeLive === true) {
    status = "launch_ready"
  }

  return NextResponse.json({
    status,
    checks,
    stripeDetails,
    stripeMissing,
    stripeLive,
    missing,
    hints,
    docs: "/PRODUCTION_CHECKLIST.md",
    timestamp,
  })
}
