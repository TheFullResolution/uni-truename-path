/**
 * Account Deletion Flow E2E Tests - Consolidated Flows
 *
 * Two comprehensive test flows covering all account deletion functionality:
 * 1. UI Validation Flow - Tests all UI interactions without deleting (non-destructive)
 * 2. Complete Deletion Flow - Tests actual deletion and verification (destructive)
 *
 * This consolidation improves performance while maintaining full test coverage.
 */

import { expect, test } from '@playwright/test';
import {
  createAndLoginTestUser,
  ensureLoggedOut,
  getOrCreateTestUser,
  type TestUser,
} from '@/utils/auth-helpers';

test.describe('Account Deletion Flow', () => {
  test('should validate UI interactions and cancel flows without deleting account', async ({
page,
  }) => {
console.log('🔐 Testing complete UI validation flow (non-destructive)...');

// Use existing authenticated user - no need for fresh user since we won't delete
const testUser = await getOrCreateTestUser(page);
console.log(`✅ Using test user for UI validation: ${testUser.email}`);

// Navigate to dashboard and settings
await page.goto('/dashboard');
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
await page.getByTestId('tab-settings').click();
await expect(page).toHaveURL('/dashboard/settings', { timeout: 10000 });

// === TEST 1: Initial Modal Display and Content ===
await page.waitForSelector('[data-testid="delete-account-button"]', {
  timeout: 10000,
});
await page.getByTestId('delete-account-button').click();

// Verify initial warning content
await page.waitForSelector('text=Delete Account', { timeout: 5000 });
await expect(page.locator('text=Permanent Action')).toBeVisible();
await expect(
  page.locator('text=This action cannot be undone'),
).toBeVisible();
await expect(
  page.locator('text=The following data will be permanently removed:'),
).toBeVisible();
console.log('✅ Initial modal content validated');

// === TEST 2: Cancel at Initial Warning Step ===
await page.getByTestId('modal-cancel-button').click();

// Wait a moment for modal to close
await page.waitForTimeout(1000);

// Modal should close and return to settings page
// Check for the modal dialog itself rather than the button text
await expect(page.locator('[role="dialog"]')).not.toBeVisible();
await expect(page).toHaveURL('/dashboard/settings');
console.log('✅ Cancel at initial step working');

// === TEST 3: Proceed to Email Confirmation ===
// Re-open modal
await page.getByTestId('delete-account-button').click();
await page.waitForSelector('text=Delete Account', { timeout: 5000 });
await page.getByTestId('modal-continue-button').click();

// Should be on email confirmation step
await expect(page.locator('text=Type Your Email to Confirm')).toBeVisible();
await expect(
  page.locator(`text=Your Email: ${testUser.email}`),
).toBeVisible();
console.log('✅ Email confirmation step reached');

// === TEST 4: Email Validation - Wrong Email ===
const wrongEmail = 'wrong@email.com';
await page.getByTestId('email-confirmation-input').fill(wrongEmail);

// Delete button should be disabled for wrong email
const deleteButton = page.getByTestId('modal-confirm-delete-button');
await expect(deleteButton).toBeDisabled();
console.log('✅ Wrong email validation working');

// === TEST 5: Email Validation - Correct Email ===
await page.getByTestId('email-confirmation-input').clear();
await page.getByTestId('email-confirmation-input').fill(testUser.email);

// Delete button should now be enabled
await expect(deleteButton).not.toBeDisabled();
console.log('✅ Correct email validation working');

// === TEST 6: Back Button from Email Confirmation ===
await page.getByTestId('modal-back-button').click();

// Should return to initial warning step
await expect(page.locator('text=Permanent Action')).toBeVisible();
console.log('✅ Back button working');

// === TEST 7: Click Outside Modal to Close ===
// Click outside modal (on backdrop)
await page.locator('body').click({ position: { x: 50, y: 50 } });

// Wait a moment for modal to close
await page.waitForTimeout(1000);

// Modal should close
await expect(page.locator('[role="dialog"]')).not.toBeVisible();
await expect(page).toHaveURL('/dashboard/settings');
console.log('✅ Click outside modal working');

console.log(
  '✅ UI validation flow completed successfully - all interactions tested',
);
  });

  test('should complete full account deletion and verify all deletion scenarios', async ({
page,
  }) => {
console.log(
  '🔐 Testing complete account deletion and verification flow...',
);

// Create a fresh user specifically for deletion
const testUser = await createAndLoginTestUser(page);
const deletedEmail = testUser.email;
const deletedPassword = testUser.password;
console.log(`✅ Created fresh test user for deletion: ${deletedEmail}`);

// === PHASE 1: Complete Account Deletion Flow ===
await page.goto('/dashboard');
await page.getByTestId('tab-settings').click();
await expect(page).toHaveURL('/dashboard/settings', { timeout: 10000 });

await page.waitForSelector('[data-testid="delete-account-button"]', {
  timeout: 10000,
});
await page.getByTestId('delete-account-button').click();

// Complete modal flow
await page.waitForSelector('text=Delete Account', { timeout: 5000 });
await page.getByTestId('modal-continue-button').click();
await page.getByTestId('email-confirmation-input').fill(deletedEmail);
await page.getByTestId('modal-confirm-delete-button').click();

// Wait for deletion completion and verify redirect
await expect(page).toHaveURL('/auth/account-deleted', { timeout: 30000 });

// Verify success page content
await expect(
  page.locator('text=Account Successfully Deleted'),
).toBeVisible();
console.log(
  '✅ Account deleted successfully and redirected to success page',
);

// === PHASE 2: Verify Deleted Account Cannot Login ===
await page.goto('/auth/login');
await page.waitForSelector('[data-testid="login-email-input"]', {
  timeout: 10000,
});

await page.getByTestId('login-email-input').fill(deletedEmail);
await page.getByTestId('login-password-input').fill(deletedPassword);
await page.getByTestId('login-submit-button').click();

// Should NOT be able to log in - should show error or stay on login page
await page.waitForTimeout(3000); // Wait for login attempt to complete

const currentUrl = page.url();
const isOnLoginPage = currentUrl.includes('/auth/login');
const isOnSignupPage = currentUrl.includes('/auth/signup');

// Should either stay on login page (with error) or redirect to signup
expect(isOnLoginPage || isOnSignupPage).toBeTruthy();
expect(currentUrl.includes('/dashboard')).toBeFalsy();
console.log('✅ Deleted account login prevented');

// === PHASE 3: Verify Direct Dashboard Access is Blocked ===
await page.goto('/dashboard');
await page.waitForTimeout(2000);

const dashboardUrl = page.url();
const redirectedFromDashboard =
  dashboardUrl.includes('/auth/login') || dashboardUrl.includes('/auth');

expect(redirectedFromDashboard).toBeTruthy();
console.log('✅ Direct dashboard access blocked for deleted account');

// === PHASE 4: Verify Email Can Be Reused for New Account ===
await ensureLoggedOut(page);
await page.goto('/auth/signup');

// Fill Step 1 form with previously deleted email
await page.waitForSelector('[data-testid="signup-email-input"]', {
  timeout: 10000,
});
await page.getByTestId('signup-email-input').fill(deletedEmail);
await page.getByTestId('signup-password-input').fill('NewPassword123!');
await page
  .getByTestId('signup-confirm-password-input')
  .fill('NewPassword123!');
await page.getByTestId('signup-terms-checkbox').check();
await page.getByTestId('signup-consent-checkbox').check();
await page.getByTestId('signup-step1-submit').click();

// Fill Step 2 form
await page.getByTestId('signup-given-name-input').fill('NewUser');
await page.getByTestId('signup-family-name-input').fill('Account');
await page.getByTestId('signup-display-name-input').fill('New Account');
await page.getByTestId('signup-step2-submit').click();

// Should successfully create new account and reach dashboard
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
console.log(
  `✅ Successfully created new account with previously deleted email: ${deletedEmail}`,
);

console.log(
  '✅ Complete deletion and verification flow completed successfully',
);
  });
});
