import { test, expect } from '@playwright/test';

test('public CV renders and can export button be visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Professional Summary')).toBeVisible();
  await expect(page.getByRole('button', { name: /Export PDF/i })).toBeVisible();
});
