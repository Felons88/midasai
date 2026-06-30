import { test, expect } from "@playwright/test"
import { E2E_EMAIL, E2E_PASSWORD, E2E_FREE_LISTING_ID, hasAuthCredentials, loginViaUi } from "./helpers/auth"

test.describe("Authenticated flows", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run")

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL!, E2E_PASSWORD!)
  })

  test("dashboard loads after login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible()
  })

  test("billing page shows plan usage", async ({ page }) => {
    await page.goto("/account/billing")
    await expect(page.getByRole("heading", { name: /billing/i })).toBeVisible()
    await expect(page.getByText(/usage this period/i)).toBeVisible()
  })

  test("notifications page loads", async ({ page }) => {
    await page.goto("/notifications")
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible()
  })
})

test.describe("Marketplace authenticated flow", () => {
  test.skip(
    !hasAuthCredentials || !E2E_FREE_LISTING_ID,
    "Set E2E_TEST_EMAIL, E2E_TEST_PASSWORD, and E2E_FREE_LISTING_ID"
  )

  test.beforeEach(async ({ page }) => {
    await loginViaUi(page, E2E_EMAIL!, E2E_PASSWORD!)
  })

  test("free listing purchase and download", async ({ page }) => {
    await page.goto(`/listing/${E2E_FREE_LISTING_ID}`)
    await page.getByRole("button", { name: /download free/i }).click()
    await expect(page.getByText(/processing/i)).toBeHidden({ timeout: 15_000 })
  })

  test("submit review on free listing", async ({ page }) => {
    await page.goto(`/listing/${E2E_FREE_LISTING_ID}`)
    await page.getByRole("button", { name: /reviews/i }).click()
    await page.getByRole("button", { name: /5 stars/i }).click()
    await page.getByLabel(/comment/i).fill("E2E test review — automated smoke")
    await page.getByRole("button", { name: /submit review/i }).click()
    await expect(
      page.getByText(/thank you|already reviewed/i)
    ).toBeVisible({ timeout: 15_000 })
  })
})

test.describe("Authenticated API", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run")

  test("billing entitlements returns tier data", async ({ page, request }) => {
    await loginViaUi(page, E2E_EMAIL!, E2E_PASSWORD!)
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ")

    const res = await request.get("/api/billing/entitlements", {
      headers: { Cookie: cookieHeader },
    })

    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    expect(data.tier).toBeTruthy()
    expect(data.limits).toBeTruthy()
    expect(data.usage).toBeTruthy()
  })
})
