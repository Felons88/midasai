/**
 * Enterprise AI Credit Service
 * Transaction-based billing: reserve → execute → capture/refund.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

export type CreditOwner = { userId: string } | { organizationId: string }

export type CreditReservationStatus =
  | "reserved"
  | "captured"
  | "partially_refunded"
  | "released"

export interface ReservationResult {
  reservationId: string
  allowed: boolean
  availableBalance: number
  message?: string
}

export interface CaptureResult {
  reservationId: string
  captured: number
  refunded: number
  balanceAfter: number
}

export interface CreditBalance {
  monthlyCredits: number
  purchasedCredits: number
  bonusCredits: number
  totalUsed: number
  lifetimeUsed: number
  available: number
  resetAt: string | null
}

function isOrg(owner: CreditOwner): owner is { organizationId: string } {
  return "organizationId" in owner
}

export class CreditService {
  constructor(private supabase: SupabaseClient) {}

  async getBalance(owner: CreditOwner): Promise<CreditBalance> {
    if (isOrg(owner)) {
      const { data, error } = await this.supabase
        .from("organization_credits")
        .select("*")
        .eq("organization_id", owner.organizationId)
        .single()

      if (error || !data) {
        return {
          monthlyCredits: 0,
          purchasedCredits: 0,
          bonusCredits: 0,
          totalUsed: 0,
          lifetimeUsed: 0,
          available: 0,
          resetAt: null,
        }
      }

      return {
        monthlyCredits: data.monthly_credits,
        purchasedCredits: data.purchased_credits,
        bonusCredits: data.bonus_credits,
        totalUsed: data.total_used,
        lifetimeUsed: data.lifetime_used,
        available: data.monthly_credits + data.purchased_credits + data.bonus_credits,
        resetAt: data.reset_at,
      }
    }

    const { data, error } = await this.supabase
      .from("credit_balances")
      .select("*")
      .eq("user_id", owner.userId)
      .single()

    if (error || !data) {
      return {
        monthlyCredits: 0,
        purchasedCredits: 0,
        bonusCredits: 0,
        totalUsed: 0,
        lifetimeUsed: 0,
        available: 0,
        resetAt: null,
      }
    }

    return {
      monthlyCredits: data.monthly_credits,
      purchasedCredits: data.purchased_credits,
      bonusCredits: data.bonus_credits,
      totalUsed: data.total_used,
      lifetimeUsed: data.lifetime_used,
      available: data.monthly_credits + data.purchased_credits + data.bonus_credits,
      resetAt: data.reset_at,
    }
  }

  async reserveCredits(
    owner: CreditOwner,
    operationId: string,
    featureKey: string,
    amount: number,
    ttlMs = 5 * 60 * 1000 // 5 minutes default
  ): Promise<ReservationResult> {
    if (amount <= 0) {
      return {
        reservationId: "",
        allowed: false,
        availableBalance: 0,
        message: "Invalid reservation amount",
      }
    }

    const balance = await this.getBalance(owner)
    if (balance.available < amount) {
      return {
        reservationId: "",
        allowed: false,
        availableBalance: balance.available,
        message: "Insufficient credits",
      }
    }

    const expiresAt = new Date(Date.now() + ttlMs).toISOString()
    const reservationId = crypto.randomUUID()

    const { error: reservationError } = await this.supabase
      .from("credit_reservations")
      .insert({
        id: reservationId,
        user_id: isOrg(owner) ? null : owner.userId,
        organization_id: isOrg(owner) ? owner.organizationId : null,
        operation_id: operationId,
        feature_key: featureKey,
        amount,
        status: "reserved",
        expires_at: expiresAt,
      })

    if (reservationError) {
      console.error("[credits] reserveCredits error:", reservationError)
      return {
        reservationId: "",
        allowed: false,
        availableBalance: balance.available,
        message: "Failed to reserve credits",
      }
    }

    await this.decrementAvailableBalance(owner, amount)

    return {
      reservationId,
      allowed: true,
      availableBalance: balance.available - amount,
    }
  }

  async captureCredits(
    owner: CreditOwner,
    reservationId: string,
    actualAmount: number
  ): Promise<CaptureResult> {
    const { data: reservation, error } = await this.supabase
      .from("credit_reservations")
      .select("*")
      .eq("id", reservationId)
      .single()

    if (error || !reservation) {
      throw new Error("Reservation not found")
    }

    if (reservation.status !== "reserved") {
      throw new Error(`Reservation is ${reservation.status}`)
    }

    const reservedAmount = reservation.amount
    if (actualAmount < 0 || actualAmount > reservedAmount) {
      throw new Error("Invalid capture amount")
    }

    const refundAmount = reservedAmount - actualAmount
    const now = new Date().toISOString()
    const status: CreditReservationStatus =
      refundAmount > 0 ? "partially_refunded" : "captured"

    const { error: updateError } = await this.supabase
      .from("credit_reservations")
      .update({
        captured_amount: actualAmount,
        refunded_amount: refundAmount,
        status,
        updated_at: now,
      })
      .eq("id", reservationId)

    if (updateError) {
      throw new Error("Failed to update reservation")
    }

    await this.recordTransaction(owner, {
      type: "capture",
      amount: -actualAmount,
      referenceId: reservationId,
      description: `Capture credits for ${reservation.feature_key}`,
    })

    if (refundAmount > 0) {
      await this.recordTransaction(owner, {
        type: "refund",
        amount: refundAmount,
        referenceId: reservationId,
        description: `Refund unused credits for ${reservation.feature_key}`,
      })
      await this.incrementAvailableBalance(owner, refundAmount)
    }

    await this.incrementTotalUsed(owner, actualAmount)

    const balance = await this.getBalance(owner)

    return {
      reservationId,
      captured: actualAmount,
      refunded: refundAmount,
      balanceAfter: balance.available,
    }
  }

  async releaseCredits(
    owner: CreditOwner,
    reservationId: string
  ): Promise<CaptureResult> {
    return this.captureCredits(owner, reservationId, 0)
  }

  async refundReservation(
    owner: CreditOwner,
    reservationId: string,
    amount: number
  ): Promise<CaptureResult> {
    const { data: reservation, error } = await this.supabase
      .from("credit_reservations")
      .select("*")
      .eq("id", reservationId)
      .single()

    if (error || !reservation) {
      throw new Error("Reservation not found")
    }

    const currentRefunded = reservation.refunded_amount ?? 0
    const currentCaptured = reservation.captured_amount ?? 0
    const remaining = reservation.amount - currentCaptured - currentRefunded

    if (amount <= 0 || amount > remaining) {
      throw new Error("Invalid refund amount")
    }

    const newRefunded = currentRefunded + amount
    const status: CreditReservationStatus =
      currentCaptured === 0 && newRefunded === reservation.amount
        ? "released"
        : "partially_refunded"

    const now = new Date().toISOString()
    await this.supabase
      .from("credit_reservations")
      .update({
        refunded_amount: newRefunded,
        status,
        updated_at: now,
      })
      .eq("id", reservationId)

    await this.recordTransaction(owner, {
      type: "refund",
      amount,
      referenceId: reservationId,
      description: `Partial refund for ${reservation.feature_key}`,
    })
    await this.incrementAvailableBalance(owner, amount)

    const balance = await this.getBalance(owner)

    return {
      reservationId,
      captured: currentCaptured,
      refunded: newRefunded,
      balanceAfter: balance.available,
    }
  }

  async allocateMonthlyCredits(
    owner: CreditOwner,
    amount: number
  ): Promise<void> {
    await this.ensureBalanceRow(owner)
    const now = new Date().toISOString()

    if (isOrg(owner)) {
      await this.supabase
        .from("organization_credits")
        .update({
          monthly_credits: amount,
          total_used: 0,
          reset_at: now,
          updated_at: now,
        })
        .eq("organization_id", owner.organizationId)
    } else {
      await this.supabase
        .from("credit_balances")
        .update({
          monthly_credits: amount,
          total_used: 0,
          reset_at: now,
          updated_at: now,
        })
        .eq("user_id", owner.userId)
    }

    await this.recordTransaction(owner, {
      type: "monthly_allocation",
      amount,
      description: "Monthly credit allocation",
    })
  }

  async addPurchasedCredits(
    owner: CreditOwner,
    amount: number,
    referenceId: string,
    description = "Credit pack purchase"
  ): Promise<void> {
    await this.ensureBalanceRow(owner)
    await this.incrementAvailableBalance(owner, amount)

    await this.recordTransaction(owner, {
      type: "purchase",
      amount,
      referenceId,
      description,
    })
  }

  async addAdminCredits(
    owner: CreditOwner,
    amount: number,
    adminId: string,
    reason: string
  ): Promise<void> {
    await this.ensureBalanceRow(owner)
    await this.incrementAvailableBalance(owner, amount)

    await this.recordTransaction(owner, {
      type: "admin_adjustment",
      amount,
      adminId,
      description: reason,
    })

    await this.supabase.from("credit_adjustments").insert({
      user_id: isOrg(owner) ? null : owner.userId,
      organization_id: isOrg(owner) ? owner.organizationId : null,
      amount,
      reason,
      admin_id: adminId,
    })
  }

  async addBonusCredits(
    owner: CreditOwner,
    amount: number,
    description: string
  ): Promise<void> {
    await this.ensureBalanceRow(owner)
    await this.incrementAvailableBalance(owner, amount)

    await this.recordTransaction(owner, {
      type: "bonus",
      amount,
      description,
    })
  }

  private async ensureBalanceRow(owner: CreditOwner): Promise<void> {
    if (isOrg(owner)) {
      const { data } = await this.supabase
        .from("organization_credits")
        .select("id")
        .eq("organization_id", owner.organizationId)
        .single()

      if (!data) {
        await this.supabase.from("organization_credits").insert({
          organization_id: owner.organizationId,
          monthly_credits: 0,
          purchased_credits: 0,
          bonus_credits: 0,
          total_used: 0,
          lifetime_used: 0,
        })
      }
    } else {
      const { data } = await this.supabase
        .from("credit_balances")
        .select("id")
        .eq("user_id", owner.userId)
        .single()

      if (!data) {
        await this.supabase.from("credit_balances").insert({
          user_id: owner.userId,
          monthly_credits: 0,
          purchased_credits: 0,
          bonus_credits: 0,
          total_used: 0,
          lifetime_used: 0,
        })
      }
    }
  }

  private async incrementAvailableBalance(
    owner: CreditOwner,
    amount: number
  ): Promise<void> {
    if (amount <= 0) return

    if (isOrg(owner)) {
      await this.supabase.rpc("increment_org_credit_balance", {
        p_organization_id: owner.organizationId,
        p_amount: amount,
      })
    } else {
      await this.supabase.rpc("increment_user_credit_balance", {
        p_user_id: owner.userId,
        p_amount: amount,
      })
    }
  }

  private async decrementAvailableBalance(
    owner: CreditOwner,
    amount: number
  ): Promise<void> {
    if (amount <= 0) return

    if (isOrg(owner)) {
      await this.supabase.rpc("decrement_org_credit_balance", {
        p_organization_id: owner.organizationId,
        p_amount: amount,
      })
    } else {
      await this.supabase.rpc("decrement_user_credit_balance", {
        p_user_id: owner.userId,
        p_amount: amount,
      })
    }
  }

  private async incrementTotalUsed(
    owner: CreditOwner,
    amount: number
  ): Promise<void> {
    if (amount <= 0) return

    if (isOrg(owner)) {
      await this.supabase.rpc("increment_org_credit_used", {
        p_organization_id: owner.organizationId,
        p_amount: amount,
      })
    } else {
      await this.supabase.rpc("increment_user_credit_used", {
        p_user_id: owner.userId,
        p_amount: amount,
      })
    }
  }

  private async recordTransaction(
    owner: CreditOwner,
    input: {
      type: string
      amount: number
      referenceId?: string
      description?: string
      adminId?: string
    }
  ): Promise<void> {
    const { error } = await this.supabase.from("credit_transactions").insert({
      user_id: isOrg(owner) ? null : owner.userId,
      organization_id: isOrg(owner) ? owner.organizationId : null,
      type: input.type as any,
      amount: input.amount,
      reference_id: input.referenceId ?? null,
      description: input.description ?? null,
      admin_id: input.adminId ?? null,
    })

    if (error) {
      console.error("[credits] recordTransaction error:", error)
    }
  }
}

export function createCreditService(supabase: SupabaseClient): CreditService {
  return new CreditService(supabase)
}
