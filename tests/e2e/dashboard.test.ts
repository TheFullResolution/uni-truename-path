// TrueNamePath: Dashboard E2E Test
// Tests comprehensive dashboard functionality including API integration
// Date: August 13, 2025

import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../utils/db-helpers';
import { AuthTestHelper } from '../utils/auth-helpers';

test.describe('Dashboard Page', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
await AuthTestHelper.cleanupTestUsers();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
await AuthTestHelper.cleanupTestUsers();
  });

  test('should load dashboard with authentication', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);
const testEmail = `test-dash-${uniqueId}@example.com`;

// Create test user and profile
await AuthTestHelper.createTestUserSession(testEmail);
await DatabaseTestHelper.createProfile(testEmail);

// Navigate to login page
await page.goto('/auth/login');

// Login with test user
await page.getByLabel('Email Address').fill(testEmail);
await page.getByLabel('Password').fill('test-password-123');
await page.getByRole('button', { name: 'Sign In' }).click();

// Should redirect to dashboard
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

// Check dashboard header is present
await expect(page.locator('text=TrueNamePath Dashboard')).toBeVisible();

// Check user email is displayed in the dashboard (not in notifications)
// Use a more specific selector to avoid matching notification text
await expect(
  page.getByText(testEmail, { exact: true }).last(),
).toBeVisible();
  });

  test('should navigate between dashboard tabs correctly', async ({ page }) => {
const uniqueId = Math.random().toString(36).substring(7);
const testEmail = `test-tabs-${uniqueId}@example.com`;

// Create test user and profile
await AuthTestHelper.createTestUserSession(testEmail);
await DatabaseTestHelper.createProfile(testEmail);

// Login first
await page.goto('/auth/login');
await page.getByLabel('Email Address').fill(testEmail);
await page.getByLabel('Password').fill('test-password-123');
await page.getByRole('button', { name: 'Sign In' }).click();
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

// Test tab navigation
await page.click('text=Names');
await expect(page.locator('text=Your Name Variants')).toBeVisible();

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
const uniqueId = Math.random().toString(36).substring(7);
const testEmail = `test-logout-${uniqueId}@example.com`;

// Create test user and profile
await AuthTestHelper.createTestUserSession(testEmail);
await DatabaseTestHelper.createProfile(testEmail);

// Login first
await page.goto('/auth/login');
await page.getByLabel('Email Address').fill(testEmail);
await page.getByLabel('Password').fill('test-password-123');
await page.getByRole('button', { name: 'Sign In' }).click();
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

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
