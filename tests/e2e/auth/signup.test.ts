import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { AuthTestHelper } from '../../utils/auth-helpers';

/**
 * Essential Signup Tests - Lean and maintainable
 *
 * Focuses only on critical functionality:
 * - Complete signup flow with all fields
 * - Minimal signup flow (legal name only)
 * - Form validation for required fields
 * - Navigation patterns
 * - Essential UI elements
 * - Database integration verification
 */
test.describe('Signup Tests', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
await AuthTestHelper.cleanupTestUsers();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
await AuthTestHelper.cleanupTestUsers();
  });

  test.describe('Signup Flow', () => {
test('should successfully signup with complete profile and redirect to dashboard', async ({
  page,
}) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const testEmail = `signup-complete-${uniqueId}@example.com`;

  await page.goto('/auth/signup');

  // Fill complete form
  await page.getByLabel('Email Address').fill(testEmail);
  await page.getByLabel('Full Legal Name').fill('Test Legal Name');
  await page.getByLabel('Preferred Display Name').fill('Test Preferred');
  await page
.getByRole('textbox', { name: 'Password', exact: true })
.fill('ValidPass123');
  await page
.getByRole('textbox', { name: 'Confirm Password', exact: true })
.fill('ValidPass123');

  // Check required consents
  await page
.getByRole('checkbox', { name: /Privacy Policy and Terms/ })
.check();
  await page
.getByRole('checkbox', { name: /context-aware name processing/ })
.check();

  // Submit form
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Should redirect to dashboard on success
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
});

test('should successfully signup with minimal profile (legal name only)', async ({
  page,
}) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const testEmail = `signup-minimal-${uniqueId}@example.com`;

  await page.goto('/auth/signup');

  // Fill minimal required fields only
  await page.getByLabel('Email Address').fill(testEmail);
  await page.getByLabel('Full Legal Name').fill('Minimal Legal Name');
  await page
.getByRole('textbox', { name: 'Password', exact: true })
.fill('ValidPass123');
  await page
.getByRole('textbox', { name: 'Confirm Password', exact: true })
.fill('ValidPass123');

  // Check required consents
  await page
.getByRole('checkbox', { name: /Privacy Policy and Terms/ })
.check();
  await page
.getByRole('checkbox', { name: /context-aware name processing/ })
.check();

  // Submit form
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
});
  });

  test.describe('Form Validation', () => {
test('should show validation errors for empty required fields', async ({
  page,
}) => {
  await page.goto('/auth/signup');

  // Submit empty form
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Essential validation messages should appear
  await expect(page.getByText('Invalid email address')).toBeVisible();
  await expect(page.getByText('Legal name is required')).toBeVisible();
  await expect(
page.getByText(
  'Password must be at least 8 characters with uppercase, lowercase, and number',
),
  ).toBeVisible();
});

test('should show password mismatch error', async ({ page }) => {
  await page.goto('/auth/signup');

  await page.getByLabel('Email Address').fill('test@example.com');
  await page.getByLabel('Full Legal Name').fill('Test Name');
  await page
.getByRole('textbox', { name: 'Password', exact: true })
.fill('ValidPass123');
  await page
.getByRole('textbox', { name: 'Confirm Password', exact: true })
.fill('DifferentPass123');

  // Trigger validation by attempting submit
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('Passwords do not match')).toBeVisible();
});

test('should show consent validation errors', async ({ page }) => {
  await page.goto('/auth/signup');

  // Fill all fields but skip consents
  await page.getByLabel('Email Address').fill('test@example.com');
  await page.getByLabel('Full Legal Name').fill('Test Name');
  await page
.getByRole('textbox', { name: 'Password', exact: true })
.fill('ValidPass123');
  await page
.getByRole('textbox', { name: 'Confirm Password', exact: true })
.fill('ValidPass123');

  await page.getByRole('button', { name: 'Create Account' }).click();

  // Should show consent validation errors
  await expect(
page.getByText(
  'You must agree to the Privacy Policy and Terms of Service',
),
  ).toBeVisible();
  await expect(
page.getByText(
  'Consent to processing is required for core functionality',
),
  ).toBeVisible();
});
  });

  test.describe('Navigation', () => {
test('should navigate to login page', async ({ page }) => {
  await page.goto('/auth/signup');

  await page
.getByRole('button', { name: 'Back to Sign In' })
.first()
.click();
  await expect(page).toHaveURL('/auth/login');
});

test('should preserve return URL when navigating to login', async ({
  page,
}) => {
  await page.goto('/auth/signup?returnUrl=%2Fdashboard');

  await page.getByRole('button', { name: 'Sign In' }).last().click();
  await expect(page).toHaveURL('/auth/login?returnUrl=%2Fdashboard');
});
  });

  test.describe('Essential UI', () => {
test('should load with essential form elements', async ({ page }) => {
  await page.goto('/auth/signup');

  // Essential form elements only - no text content validation
  await expect(page.getByLabel('Email Address')).toBeVisible();
  await expect(page.getByLabel('Full Legal Name')).toBeVisible();
  await expect(page.getByLabel('Preferred Display Name')).toBeVisible();
  await expect(
page.getByRole('textbox', { name: 'Password', exact: true }),
  ).toBeVisible();
  await expect(
page.getByRole('textbox', { name: 'Confirm Password', exact: true }),
  ).toBeVisible();
  await expect(
page.getByRole('button', { name: 'Create Account' }),
  ).toBeVisible();
  await expect(
page.getByRole('button', { name: 'Back to Sign In' }).first(),
  ).toBeVisible();

  // Required consent checkboxes
  await expect(
page.getByRole('checkbox', { name: /Privacy Policy and Terms/ }),
  ).toBeVisible();
  await expect(
page.getByRole('checkbox', { name: /context-aware name processing/ }),
  ).toBeVisible();
});
  });
});
