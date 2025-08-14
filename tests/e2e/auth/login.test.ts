import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { AuthTestHelper } from '../../utils/auth-helpers';
import {
  OptimizedTestPattern,
  TEST_SUITE_CONFIGS,
} from '../../utils/shared-test-setup';

/**
 * Essential Login Tests - Performance Optimized
 *
 * Focuses only on critical functionality:
 * - Authentication flow
 * - Form validation
 * - Navigation
 * - Essential UI elements
 *
 * NOTE: Auth tests need unique users (testing login flow) but use optimized cleanup
 */

// Initialize optimized test pattern for auth tests (uses full cleanup strategy)
const testPattern = new OptimizedTestPattern(TEST_SUITE_CONFIGS.AUTH_FLOW);

test.describe('Login Tests', () => {
  test.beforeAll(async () => {
await testPattern.setupSuite();
  });

  test.afterAll(async () => {
await testPattern.teardownSuite();
  });

  test.beforeEach(async ({}, testInfo) => {
await testPattern.setupTest(testInfo.title);
  });

  test.afterEach(async ({}, testInfo) => {
await testPattern.teardownTest(testInfo.title);
  });

  test.describe('Authentication Flow', () => {
test('should successfully login with valid credentials and redirect to dashboard', async ({
  page,
}) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const testEmail = `test-${uniqueId}@example.com`;

  await AuthTestHelper.createTestUserSession(testEmail);
  await DatabaseTestHelper.createProfile(testEmail);

  await page.goto('/auth/login');

  // Fill and submit form
  await page.getByLabel('Email Address').fill(testEmail);
  await page.getByLabel('Password').fill('test-password-123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Should redirect to dashboard on success
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
});

test('should show error for invalid credentials', async ({ page }) => {
  await page.goto('/auth/login');

  // Fill with invalid credentials
  await page.getByLabel('Email Address').fill('invalid@example.com');
  await page.getByLabel('Password').fill('wrongpassword123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Should show authentication error
  await expect(page.locator('.mantine-Alert-root')).toBeVisible({
timeout: 10000,
  });
});
  });

  test.describe('Form Validation', () => {
test('should show validation errors for empty form', async ({ page }) => {
  await page.goto('/auth/login');

  // Submit empty form
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Both validation errors should appear
  await expect(page.getByText('Invalid email address')).toBeVisible();
  await expect(
page.getByText('Password must be at least 8 characters long'),
  ).toBeVisible();
});

test('should clear validation errors when valid inputs are provided', async ({
  page,
}) => {
  await page.goto('/auth/login');

  // Submit empty form to trigger validation
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Invalid email address')).toBeVisible();

  // Fill valid inputs
  await page.getByLabel('Email Address').fill('test@example.com');
  await page.getByLabel('Password').fill('validpassword123');

  // Validation errors should clear (or at least not be visible after form interaction)
  await expect(page.getByText('Invalid email address')).not.toBeVisible();
  await expect(
page.getByText('Password must be at least 8 characters long'),
  ).not.toBeVisible();
});
  });

  test.describe('Navigation', () => {
test('should navigate to signup page', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL('/auth/signup');
});

test('should preserve return URL when navigating to signup', async ({
  page,
}) => {
  await page.goto('/auth/login?returnUrl=/dashboard');

  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL('/auth/signup?returnUrl=%2Fdashboard');
});
  });

  test.describe('Essential UI', () => {
test('should load with essential form elements', async ({ page }) => {
  await page.goto('/auth/login');

  // Essential form elements only - no text content validation
  await expect(page.getByLabel('Email Address')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  await expect(
page.getByRole('button', { name: 'Create Account' }),
  ).toBeVisible();
  await expect(
page.getByRole('button', { name: 'Forgot Password?' }),
  ).toBeVisible();
});
  });
});
