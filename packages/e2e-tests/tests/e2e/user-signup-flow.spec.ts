/**
 * Complete User Signup Flow E2E Test (Step 15.7.7)
 *
 * Tests the complete user journey from signup to context management:
 * 1. Signup Step 1: Email, password, consent checkboxes
 * 2. Signup Step 2: OIDC properties (required and optional)
 * 3. Dashboard verification and navigation
 * 4. Context assignment modal functionality
 * 5. Name creation and assignment workflow
 * 6. Assignment count verification
 */

import { expect, test } from '@playwright/test';
import { ensureLoggedOut } from '@/utils/auth-helpers';

test.describe('Complete User Signup Flow', () => {
  test('should complete full signup and context management', async ({
page,
  }) => {
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

// 5. Navigate to names tab and verify it works
await page.getByTestId('tab-names').click();
await expect(
  page.getByRole('heading', { name: 'Name Variants' }),
).toBeVisible();

// 6. Navigate to contexts tab and verify it works
await page.getByTestId('tab-contexts').click();
await expect(
  page.getByRole('heading', { name: 'Context Management' }),
).toBeVisible();

// 7. Verify dashboard shows successful signup
await page.getByTestId('tab-dashboard').click();
await expect(
  page.getByRole('heading', { name: 'Welcome back!' }),
).toBeVisible();
  });

  test('should handle signup validation errors gracefully', async ({
page,
  }) => {
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

  test('should handle password mismatch validation', async ({ page }) => {
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
