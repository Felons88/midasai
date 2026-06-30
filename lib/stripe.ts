import Stripe from "stripe"

let stripeClient: Stripe | null = null

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripeClient) {
    stripeClient = new Stripe(key)
  }
  return stripeClient
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null
}

export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 15)

export function computeFees(amount: number) {
  const fee = amount > 0 ? (amount * PLATFORM_FEE_PERCENT) / 100 : 0
  return { fee, netAmount: amount - fee }
}
