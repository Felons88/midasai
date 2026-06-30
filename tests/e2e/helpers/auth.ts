export const E2E_EMAIL = process.env.E2E_TEST_EMAIL
export const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD
export const E2E_FREE_LISTING_ID = process.env.E2E_FREE_LISTING_ID

export const hasAuthCredentials = Boolean(E2E_EMAIL && E2E_PASSWORD)

export async function loginViaUi(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/auth/login")
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await page.waitForURL((url) => !url.pathname.includes("/auth/login"), {
    timeout: 20_000,
  })
}
