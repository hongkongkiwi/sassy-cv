import { test, expect } from '@playwright/test';

test('admin requires authentication', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByText(/Authentication Required|Please sign in/i)).toBeVisible();
});
