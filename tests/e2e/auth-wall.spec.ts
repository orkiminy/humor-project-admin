import { test, expect } from '@playwright/test'

test.describe('Auth wall', () => {
  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated /dashboard/users redirects', async ({ page }) => {
    await page.goto('/dashboard/users')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated /dashboard/terms redirects', async ({ page }) => {
    await page.goto('/dashboard/terms')
    await expect(page).toHaveURL(/\/login/)
  })
})
