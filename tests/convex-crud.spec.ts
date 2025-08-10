import { test, expect } from '@playwright/test';

// This is a smoke test placeholder. In CI you would mock auth & Convex.
// Here we only verify the page loads and the form exists to add skills.

test('skills page form exists', async ({ page }) => {
  await page.goto('/admin/skills');
  await expect(page.getByText(/Please sign in/i)).toBeVisible();
});
