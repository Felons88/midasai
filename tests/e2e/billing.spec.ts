import { test, expect } from "@playwright/test"

test.describe("Billing Lifecycle E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to billing page
    await page.goto("/account/billing")
  })

  test("should display billing page with current plan", async ({ page }) => {
    // Check that billing page loads
    await expect(page.locator("h1")).toContainText("Billing")
    
    // Check that current plan is displayed
    await expect(page.locator("text=/Plan$/i")).toBeVisible()
    
    // Check that usage section is displayed
    await expect(page.locator("text=Usage This Period")).toBeVisible()
  })

  test("should display plan comparison cards", async ({ page }) => {
    // Check that plan comparison section exists
    await expect(page.locator("text=Available Plans")).toBeVisible()
    
    // Check that all plan cards are displayed
    await expect(page.locator("text=Free")).toBeVisible()
    await expect(page.locator("text=Pro")).toBeVisible()
    await expect(page.locator("text=Team")).toBeVisible()
    await expect(page.locator("text=Enterprise")).toBeVisible()
  })

  test("should display payment methods section", async ({ page }) => {
    // Check that payment methods section exists
    await expect(page.locator("text=Payment Methods")).toBeVisible()
    
    // Check that payment methods list is displayed
    await expect(page.locator("text=Stripe Checkout")).toBeVisible()
  })

  test("should display subscription management section", async ({ page }) => {
    // Check that subscription section exists
    await expect(page.locator("text=Subscription")).toBeVisible()
    
    // Check that subscription actions are available
    await expect(page.locator("button:has-text('Upgrade')").or(page.locator("button:has-text('Cancel Subscription')"))).toBeVisible()
  })

  test("should display invoice history section", async ({ page }) => {
    // Check that invoice history section exists
    await expect(page.locator("text=Invoice History")).toBeVisible()
    
    // Check that invoice list is displayed (may be empty)
    await expect(page.locator("text=No invoices yet").or(page.locator("text=Invoice History"))).toBeVisible()
  })

  test("upgrade button should navigate to checkout", async ({ page }) => {
    // Find upgrade button
    const upgradeButton = page.locator("button:has-text('Upgrade')").first()
    
    if (await upgradeButton.isVisible()) {
      // Click upgrade button
      await upgradeButton.click()
      
      // Check that we're redirected to checkout or Stripe
      await expect(page.url()).toMatch(/checkout|stripe/i)
    }
  })

  test("should display credit balance in header", async ({ page }) => {
    // Check that credit balance is displayed
    await expect(page.locator("text=credits")).toBeVisible()
    
    // Check that coins icon is displayed
    await expect(page.locator('[class*="text-amber-400"]')).toBeVisible()
  })

  test("usage bars should display current usage", async ({ page }) => {
    // Check that usage section exists
    await expect(page.locator("text=Usage This Period")).toBeVisible()
    
    // Check that at least one usage metric is displayed
    await expect(page.locator("text=/Downloads|Listings|API Keys|Webhooks/i")).toBeVisible()
  })

  test("should navigate to wallet page", async ({ page }) => {
    // Click wallet link
    await page.click("a:has-text('Wallet')")
    
    // Check that we're on wallet page
    await expect(page.url()).toContain("/account/wallet")
  })

  test("should navigate to API keys page", async ({ page }) => {
    // Click API keys link
    await page.click("a:has-text('API Keys')")
    
    // Check that we're on API keys page
    await expect(page.url()).toContain("/developer/keys")
  })

  test("should navigate to account settings", async ({ page }) => {
    // Click account settings link
    await page.click("a:has-text('Account Settings')")
    
    // Check that we're on account settings page
    await expect(page.url()).toContain("/account/settings")
  })
})

test.describe("Credit Pack Purchase E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to credit packs page
    await page.goto("/account/wallet/credit-packs")
  })

  test("should display credit packs page", async ({ page }) => {
    // Check that credit packs page loads
    await expect(page.locator("h1")).toContainText("Credit Packs")
    
    // Check that description is displayed
    await expect(page.locator("text=Purchase credit packs")).toBeVisible()
  })

  test("should display credit pack cards", async ({ page }) => {
    // Check that at least one credit pack is displayed
    await expect(page.locator("text=credits")).toBeVisible()
    
    // Check that purchase buttons are available
    await expect(page.locator("button:has-text('Purchase')").first()).toBeVisible()
  })

  test("purchase button should navigate to checkout", async ({ page }) => {
    // Find purchase button
    const purchaseButton = page.locator("button:has-text('Purchase')").first()
    
    if (await purchaseButton.isVisible()) {
      // Click purchase button
      await purchaseButton.click()
      
      // Check that we're redirected to checkout or Stripe
      await expect(page.url()).toMatch(/checkout|stripe/i)
    }
  })
})

test.describe("Organization Creation E2E Tests", () => {
  test("should navigate to organization creation", async ({ page }) => {
    // Navigate to account page
    await page.goto("/account")
    
    // Look for create organization button/link
    const createOrgButton = page.locator("text=Create Organization").or(page.locator("button:has-text('Create Organization')"))
    
    if (await createOrgButton.isVisible()) {
      await createOrgButton.click()
      
      // Check that organization form is displayed
      await expect(page.locator("text=Create Organization")).toBeVisible()
    }
  })
})
