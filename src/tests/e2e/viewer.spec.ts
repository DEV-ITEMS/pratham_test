import { test, expect } from '@playwright/test';

test('demo project loads with navigation pins', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page).toHaveURL(/editor\/modern-flat-tour/);
  await expect(page.getByRole('heading', { name: 'Modern Flat Tour' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Snapshot' })).toBeVisible();
});
