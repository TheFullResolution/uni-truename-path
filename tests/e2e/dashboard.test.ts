// TrueNamePath: Dashboard E2E Test - Performance Optimized
// Tests comprehensive dashboard functionality including API integration
// Date: August 14, 2025 - Performance optimization update

import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../utils/db-helpers';
import { AuthTestHelper } from '../utils/auth-helpers';
import {
  SharedTestSetup,
  OptimizedTestPattern,
  TEST_SUITE_CONFIGS,
} from '../utils/shared-test-setup';

// Initialize optimized test pattern for dashboard tests
const testPattern = new OptimizedTestPattern(TEST_SUITE_CONFIGS.DASHBOARD);

test.describe('Dashboard Page', () => {
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

  test('should load dashboard with authentication', async ({ page }) => {
// Use shared user with optimized authentication
await testPattern.authenticateWithSharedUser(page, '/dashboard');

// Check dashboard header is present
await expect(page.locator('text=TrueNamePath Dashboard')).toBeVisible();

// Check user email is displayed in the dashboard (not in notifications)
// Use a more specific selector to avoid matching notification text
const sharedUser = testPattern.getSharedUser();
await expect(
  page.getByText(sharedUser.email, { exact: true }).last(),
).toBeVisible();
  });

  test('should navigate between dashboard tabs correctly', async ({ page }) => {
// Use shared user with optimized authentication
await testPattern.authenticateWithSharedUser(page, '/dashboard');

// Test tab navigation
await page.click('text=Names');
await expect(
  page.getByRole('heading', { name: 'Your Name Variants' }),
).toBeVisible();

await page.click('text=Consents');
// Use role selector to target the heading specifically
await expect(
  page.getByRole('heading', { name: 'Consent Management' }),
).toBeVisible();

await page.click('text=Settings');
// Use role selector to target the heading specifically
await expect(
  page.getByRole('heading', { name: 'Account Settings' }),
).toBeVisible();

// Go back to dashboard
await page.click('text=Dashboard');
// Just check the TrueNamePath Dashboard header is visible to confirm we're on dashboard tab
await expect(page.locator('text=TrueNamePath Dashboard')).toBeVisible();
  });

  test('should handle logout correctly from dashboard', async ({ page }) => {
// Use shared user with optimized authentication
await testPattern.authenticateWithSharedUser(page, '/dashboard');

// Click logout button
await page.click('text=Sign Out');

// Should redirect to login page (with or without returnUrl parameter)
await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

// Should show success notification
await expect(page.locator('text=Signed out successfully')).toBeVisible({
  timeout: 5000,
});
  });
});
