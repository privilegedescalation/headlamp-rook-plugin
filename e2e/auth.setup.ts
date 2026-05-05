import { test as setup, expect, Page } from '@playwright/test';

const AUTH_STATE_PATH = 'e2e/.auth/state.json';

async function authenticateWithOIDC(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/');
  await page.waitForURL('**/login');

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /sign in/i }).click();
  const popup = await popupPromise;

  await popup.waitForLoadState('domcontentloaded');
  await popup.waitForLoadState('networkidle');

  const usernameField = popup.getByRole('textbox', { name: /email or username/i });
  await usernameField.waitFor({ state: 'visible', timeout: 15_000 });
  await usernameField.fill(username);
  await popup.getByRole('button', { name: /log in/i }).click();

  await popup.waitForLoadState('networkidle');
  const passwordField = popup.getByRole('textbox', { name: /password/i });
  await passwordField.waitFor({ state: 'visible', timeout: 15_000 });
  await passwordField.fill(password);
  await popup.getByRole('button', { name: /continue|log in/i }).click();

  await popup.waitForEvent('close', { timeout: 15_000 });

  await expect(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible({
    timeout: 15_000,
  });
}

async function authenticateWithToken(page: Page, token: string): Promise<void> {
  await page.goto('/');
  await page.waitForURL(/\/(login|token)$/);

  if (page.url().includes('/login')) {
    const useTokenBtn = page.getByRole('button', { name: /use a token/i });
    await useTokenBtn.waitFor({ state: 'visible', timeout: 15_000 });
    await useTokenBtn.click();
    await page.waitForURL('**/token');
  }

  await page.getByRole('textbox', { name: /id token/i }).fill(token);
  await page.getByRole('button', { name: /authenticate/i }).click();

  await expect(page.getByRole('navigation', { name: 'Navigation' })).toBeVisible({
    timeout: 15_000,
  });
}

setup('authenticate with Headlamp', async ({ page }) => {
  const username = process.env.AUTHENTIK_USERNAME;
  const password = process.env.AUTHENTIK_PASSWORD;
  const token = process.env.HEADLAMP_TOKEN;

  if (username && password) {
    await authenticateWithOIDC(page, username, password);
  } else if (token) {
    await authenticateWithToken(page, token);
  } else {
    throw new Error(
      'Set AUTHENTIK_USERNAME + AUTHENTIK_PASSWORD for OIDC auth, or HEADLAMP_TOKEN for token auth'
    );
  }

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
