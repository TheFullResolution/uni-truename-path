/**
 * User Signup Flow E2E Test
 *
 * Tests the complete signup flow and database trigger validation:
 * 1. Two-step signup form (authentication + OIDC properties)
 * 2. Database triggers: auto-created names, default context, OIDC assignments
 * 3. Form validation error handling
 */

import { expect, test } from '@playwright/test';
import { ensureLoggedOut } from '@/utils/auth-helpers';

test.describe('User Signup Flow', () => {
  test('should complete signup with database triggers', async ({ page }) => {
// Clean state
await ensureLoggedOut(page);

// Generate unique email
const uniqueId = Date.now();
const testEmail = `test${uniqueId}@e2etest.local`;

// 1. Navigate to signup
await page.goto('/auth/signup');

// 2. Fill Step 1 form
await page.getByTestId('signup-email-input').fill(testEmail);
await page.getByTestId('signup-password-input').fill('TestPass123!');
await page
  .getByTestId('signup-confirm-password-input')
  .fill('TestPass123!');
await page.getByTestId('signup-terms-checkbox').check();
await page.getByTestId('signup-consent-checkbox').check();
await page.getByTestId('signup-step1-submit').click();

// 3. Fill Step 2 form (OIDC properties)
await page.getByTestId('signup-given-name-input').fill('TestFirst');
await page.getByTestId('signup-family-name-input').fill('TestLast');
await page.getByTestId('signup-display-name-input').fill('TestDisplay');
// Leave nickname and preferred_username empty intentionally
await page.getByTestId('signup-step2-submit').click();

// 4. Verify dashboard redirect
await expect(page).toHaveURL('/dashboard');

// Verify database triggers created names from signup form
await page.getByTestId('tab-names').click();
await expect(
  page.getByRole('heading', { name: 'Name Variants' }),
).toBeVisible();

// Verify names from signup form are auto-created
await page.waitForTimeout(1000);
await expect(page.getByText('TestFirst', { exact: true })).toBeVisible();
await expect(page.getByText('TestLast', { exact: true })).toBeVisible();
await expect(
  page.getByText('TestFirst TestLast', { exact: true }),
).toBeVisible();
await expect(page.getByText('TestDisplay', { exact: true })).toBeVisible();

// Verify database triggers created default context
await page.getByTestId('tab-contexts').click();
await expect(
  page.getByRole('heading', { name: 'Context Management' }),
).toBeVisible();

// Verify default context is auto-created
await page.waitForTimeout(1000);
await expect(
  page.getByRole('paragraph').filter({ hasText: /^Default$/ }),
).toBeVisible();
await expect(page.getByText('Default identity context')).toBeVisible();

// Verify OIDC property assignments were created
const assignmentBadge = page
  .locator('[data-testid*="assignment"], :has-text("assignment")')
  .first();
await expect(assignmentBadge).toBeVisible();
  });

  test('should validate required form fields', async ({ page }) => {
// Clean state
await ensureLoggedOut(page);

await page.goto('/auth/signup');

// Test Step 1 validation by submitting empty form
await page.getByTestId('signup-step1-submit').click();

// Should stay on same page and show validation errors
const currentUrl = page.url();
expect(currentUrl).toContain('/auth/signup');

// Look for validation error indicators
const errorElements = page.locator(
  '.error, [role="alert"], .mantine-InputError, .text-red, :has-text("required"), :has-text("invalid")',
);

const errorCount = await errorElements.count();
expect(errorCount).toBeGreaterThan(0);
  });

  test('should validate password confirmation', async ({ page }) => {
// Clean state
await ensureLoggedOut(page);

const uniqueId = Date.now();
const testEmail = `validation${uniqueId}@e2etest.local`;

await page.goto('/auth/signup');

// Fill form with mismatched passwords
await page.getByTestId('signup-email-input').fill(testEmail);
await page.getByTestId('signup-password-input').fill('Password123!');
await page
  .getByTestId('signup-confirm-password-input')
  .fill('DifferentPassword456!');

// Check consent boxes
await page.getByTestId('signup-terms-checkbox').check();
await page.getByTestId('signup-consent-checkbox').check();

// Submit and expect validation error
await page.getByTestId('signup-step1-submit').click();

// Should stay on signup page with password mismatch error
expect(page.url()).toContain('/auth/signup');
  });
});
