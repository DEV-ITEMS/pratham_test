import { test, expect } from '@playwright/test';

test('demo project loads with navigation pins', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'auth.currentUser',
      JSON.stringify({
        id: 'user_e2e',
        orgId: 'org1',
        name: 'E2E User',
        email: 'e2e@example.com',
        role: 'ADMIN',
      }),
    );
  });
  await page.goto('http://localhost:5173/');
  await expect(page).toHaveURL(/editor\/modern-flat-tour/);
  await expect(page.getByText('Modern Flat Tour')).toBeVisible();
  await expect(page.getByTestId('panorama-viewer')).toBeVisible({ timeout: 15000 });
});
