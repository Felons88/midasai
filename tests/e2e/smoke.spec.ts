import { test, expect } from "@playwright/test"
import { getAdminRoutePrefix } from "@/lib/admin-route"

test.describe("Public smoke", () => {
  test("homepage loads with marketplace branding", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/MidasAI/i)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("login page renders", async ({ page }) => {
    await page.goto("/auth/login")
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test("contact page renders form", async ({ page }) => {
    await page.goto("/contact")
    await expect(page.getByLabel(/^name$/i)).toBeVisible()
    await expect(page.getByLabel(/^email$/i)).toBeVisible()
    await expect(page.getByLabel(/^message$/i)).toBeVisible()
  })

  test("search page loads", async ({ page }) => {
    await page.goto("/search")
    await expect(page.getByRole("heading", { name: /Search Skills|Search Results/i })).toBeVisible()
  })

  test("robots.txt is served", async ({ request }) => {
    const res = await request.get("/robots.txt")
    expect(res.ok()).toBeTruthy()
    const body = await res.text()
    expect(body.toLowerCase()).toContain("user-agent")
  })

  test("sitemap.xml is served", async ({ request }) => {
    const res = await request.get("/sitemap.xml")
    expect(res.ok()).toBeTruthy()
  })

  test("admin alias is resolved and default /admin is blocked", async ({ request }) => {
    const adminPrefix = getAdminRoutePrefix()
    if (adminPrefix === "/admin") {
      test.skip()
      return
    }
    const res = await request.get("/admin/dashboard", { maxRedirects: 0 })
    expect(res.status()).toBe(404)
  })

  test("admin alias redirects to login when unauthenticated", async ({ request }) => {
    const adminPrefix = getAdminRoutePrefix()
    const res = await request.get(`${adminPrefix}/dashboard`, { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    const location = res.headers()["location"] ?? ""
    expect(location).toContain("/auth/login")
  })
})

test.describe("API smoke", () => {
  test("contact API rejects empty body", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test("collections API requires auth", async ({ request }) => {
    const res = await request.get("/api/collections")
    expect(res.status()).toBe(401)
  })

  test("billing entitlements API requires auth", async ({ request }) => {
    const res = await request.get("/api/billing/entitlements")
    expect(res.status()).toBe(401)
  })

  test("listings create API requires auth", async ({ request }) => {
    const res = await request.post("/api/listings", { data: { title: "x", description: "y", type: "SKILL" } })
    expect(res.status()).toBe(401)
  })

  test("stripe subscribe API requires auth", async ({ request }) => {
    const res = await request.post("/api/stripe/subscribe", { data: { tier: "PRO" } })
    expect(res.status()).toBe(401)
  })

  test("payout export API requires auth", async ({ request }) => {
    const res = await request.get("/api/creator/payouts/export")
    expect(res.status()).toBe(401)
  })

  test("health endpoint returns public status only", async ({ request }) => {
    const res = await request.get("/api/health")
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toHaveProperty("status")
    expect(body).toHaveProperty("timestamp")
    expect(body).not.toHaveProperty("stripeDetails")
    expect(body).not.toHaveProperty("checks")
  })

  test("health diagnostics require secret", async ({ request }) => {
    const secret = process.env.HEALTH_CHECK_SECRET ?? process.env.ADMIN_SECRET_ROUTE
    test.skip(!secret, "HEALTH_CHECK_SECRET not set")

    const res = await request.get("/api/health", {
      headers: { "x-health-secret": secret! },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toHaveProperty("checks")
    expect(body).toHaveProperty("missing")
    expect(body).toHaveProperty("hints")
  })

  test("listing media API requires auth", async ({ request }) => {
    const res = await request.patch("/api/listings/00000000-0000-0000-0000-000000000001/media", {
      data: { images: [] },
    })
    expect(res.status()).toBe(401)
  })

  test("github auth API requires auth", async ({ request }) => {
    const res = await request.get("/api/github/auth")
    expect(res.status()).toBe(401)
  })

  test("github repos API requires auth", async ({ request }) => {
    const res = await request.get("/api/github/repos")
    expect(res.status()).toBe(401)
  })

  test("analyze API is deprecated", async ({ request }) => {
    const res = await request.post("/api/analyze", { data: { type: "github", url: "https://github.com/a/b" } })
    expect(res.status()).toBe(410)
  })

  test("analytics event API accepts valid events", async ({ request }) => {
    const res = await request.post("/api/analytics/event", {
      data: {
        event: "listing_clicked",
        properties: { listing_id: "37246ef6-4b70-4413-b04e-d4269e8c74b7", type: "SKILL" },
      },
    })
    expect(res.ok()).toBeTruthy()
  })

  test("recommendations API returns results", async ({ request }) => {
    const res = await request.get("/api/recommendations")
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toHaveProperty("recommendations")
    expect(Array.isArray(body.recommendations)).toBe(true)
  })

  test("unknown routes return 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-midasai")
    await expect(page.locator(".not-found-glitch")).toBeVisible()
    await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible({ timeout: 5000 })
  })
})
