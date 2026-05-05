import { test, expect } from '@playwright/test';

async function waitForSidebar(page: import('@playwright/test').Page) {
  const sidebar = page.getByRole('navigation', { name: 'Navigation' });
  await expect(sidebar).toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  return sidebar;
}

test.describe('Rook plugin smoke tests', () => {
  test('sidebar contains Rook entry', async ({ page }) => {
    await page.goto('/');
    const sidebar = await waitForSidebar(page);
    await expect(sidebar.getByRole('button', { name: /rook/i })).toBeVisible();
  });

  test('Rook sidebar entry navigates to overview', async ({ page }) => {
    await page.goto('/');
    const sidebar = await waitForSidebar(page);

    const rookEntry = sidebar.getByRole('button', { name: /rook/i });
    await expect(rookEntry).toBeVisible();
    await rookEntry.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/rook-ceph/);
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible();
  });

  test('overview page renders content', async ({ page }) => {
    await page.goto('/c/main/rook-ceph');
    await waitForSidebar(page);

    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible({
      timeout: 15_000,
    });

    const hasContent = await page.locator('text=/cluster|ceph|status/i').first().isVisible().catch(() => false);
    const hasDashboard = await page.locator('[class*="Mui"]').first().isVisible().catch(() => false);
    expect(hasContent || hasDashboard).toBe(true);
  });

  test('navigation to storage classes view works', async ({ page }) => {
    await page.goto('/c/main/rook-ceph');
    const sidebar = page.getByRole('navigation', { name: 'Navigation' });

    const rookBtn = sidebar.getByRole('button', { name: /rook/i });
    await rookBtn.click();
    await page.waitForLoadState('networkidle');

    const storageClassesLink = sidebar.getByRole('link', { name: /storage classes/i });
    await expect(storageClassesLink).toBeVisible({ timeout: 10_000 });
    await storageClassesLink.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/rook-ceph\/storage-classes/);
    await expect(page.getByRole('heading', { name: /storage class/i })).toBeVisible({ timeout: 15_000 });
  });

  test('plugin settings page shows rook plugin entry', async ({ page }) => {
    await page.goto('/settings/plugins');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[class*="PluginList"], [class*="plugins"], table, list', { timeout: 10_000 }).catch(() => {});

    const pluginEntry = page.locator('text=/rook/i').first();
    await expect(pluginEntry).toBeVisible({ timeout: 30_000 });
  });
});
