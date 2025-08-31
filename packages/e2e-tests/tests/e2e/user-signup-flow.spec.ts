// User Signup Flow E2E Test

import { expect, test } from '@playwright/test';
import { ensureLoggedOut } from '@/utils/auth-helpers';

test.describe('User Signup Flow', () => {
  test('should complete signup with database triggers', async ({ page }) => {
await ensureLoggedOut(page);

const uniqueId = Date.now();
const testEmail = `test${uniqueId}@e2etest.local`;

await page.goto('/auth/signup');
await page.getByTestId('signup-email-input').fill(testEmail);
await page.getByTestId('signup-password-input').fill('TestPass123!');
await page
  .getByTestId('signup-confirm-password-input')
  .fill('TestPass123!');
await page.getByTestId('signup-terms-checkbox').check();
await page.getByTestId('signup-consent-checkbox').check();
await page.getByTestId('signup-step1-submit').click();

await page.getByTestId('signup-given-name-input').fill('TestFirst');
await page.getByTestId('signup-family-name-input').fill('TestLast');
await page.getByTestId('signup-display-name-input').fill('TestDisplay');
await page.getByTestId('signup-step2-submit').click();

await expect(page).toHaveURL('/auth/login?signup=success');

await page.getByTestId('login-email-input').fill(testEmail);
await page.getByTestId('login-password-input').fill('TestPass123!');
await page.getByTestId('login-submit-button').click();
await expect(page).toHaveURL('/dashboard');

await page.getByTestId('tab-names').click();
await expect(page.getByTestId('tab-panel-title-names')).toBeVisible();

await page.waitForTimeout(1000);
await expect(page.getByTestId('name-card-testfirst')).toBeVisible();
await expect(page.getByTestId('name-card-testlast')).toBeVisible();
await expect(
  page.getByTestId('name-card-testfirst-testlast'),
).toBeVisible();
await expect(page.getByTestId('name-card-testdisplay')).toBeVisible();

await page.getByTestId('tab-contexts').click();
await expect(page.getByTestId('tab-panel-title-contexts')).toBeVisible();

await page.waitForTimeout(1000);
await expect(page.getByTestId('context-card-default')).toBeVisible();
await expect(
  page.locator(
'[data-testid="context-card-default"] [data-testid="context-name"]',
  ),
).toContainText('Default');

await expect(
  page.locator(
'[data-testid="context-card-default"] [data-testid="assignment-count-badge"]',
  ),
).toBeVisible();
  });

  test('should validate required form fields', async ({ page }) => {
await ensureLoggedOut(page);

await page.goto('/auth/signup');

await page.getByTestId('signup-step1-submit').click();

const currentUrl = page.url();
expect(currentUrl).toContain('/auth/signup');
const errorElements = page.locator(
  '.error, [role="alert"], .mantine-InputError, .text-red, :has-text("required"), :has-text("invalid")',
);

const errorCount = await errorElements.count();
expect(errorCount).toBeGreaterThan(0);
  });

  test('should validate password confirmation', async ({ page }) => {
await ensureLoggedOut(page);

const uniqueId = Date.now();
const testEmail = `validation${uniqueId}@e2etest.local`;

await page.goto('/auth/signup');

await page.getByTestId('signup-email-input').fill(testEmail);
await page.getByTestId('signup-password-input').fill('Password123!');
await page
  .getByTestId('signup-confirm-password-input')
  .fill('DifferentPassword456!');

await page.getByTestId('signup-terms-checkbox').check();
await page.getByTestId('signup-consent-checkbox').check();

await page.getByTestId('signup-step1-submit').click();

expect(page.url()).toContain('/auth/signup');
  });
});
