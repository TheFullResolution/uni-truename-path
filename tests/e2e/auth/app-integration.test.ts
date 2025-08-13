import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { AuthTestHelper } from '../../utils/auth-helpers';

test.describe('Application Integration Tests', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
await AuthTestHelper.cleanupTestUsers();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
await AuthTestHelper.cleanupTestUsers();
  });

  test.describe('Core App', () => {
test('should load app successfully with essential elements', async ({
  page,
}) => {
  await page.goto('/');

  // Check app loads and has essential elements (now uses LogoWithText image component)
  await expect(
page.getByRole('img', { name: 'TrueNamePath' }),
  ).toBeVisible();
  await expect(page.locator('html[lang="en"]')).toBeVisible();

  // Verify basic navigation structure exists
  const scripts = await page.locator('head script').count();
  expect(scripts).toBeGreaterThan(0);
});

test('should work on mobile and desktop (responsive)', async ({ page }) => {
  // Test desktop
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');
  await expect(
page.getByRole('img', { name: 'TrueNamePath' }),
  ).toBeVisible();

  // Test mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(
page.getByRole('img', { name: 'TrueNamePath' }),
  ).toBeVisible();
});
  });

  test.describe('Route Protection', () => {
test('should redirect protected routes to login when unauthenticated', async ({
  page,
}) => {
  // Test dashboard redirect
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login.*returnUrl/);

  // Test profile redirect
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/auth\/login.*returnUrl/);

  // Test settings redirect
  await page.goto('/settings');
  await expect(page).toHaveURL(/\/auth\/login.*returnUrl/);
});

test('should allow public routes without authentication', async ({
  page,
}) => {
  // Home page accessible
  await page.goto('/');
  await expect(page).toHaveURL('/');

  // Demo page accessible
  await page.goto('/demo');
  await expect(page).toHaveURL('/demo');

  // Login page itself accessible
  await page.goto('/auth/login');
  await expect(page).toHaveURL('/auth/login');
});
  });

  test.describe('Authentication Flow', () => {
test('should complete login flow and preserve redirect URL', async ({
  page,
}) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const testEmail = `test-${uniqueId}@example.com`;

  // Create test user
  await AuthTestHelper.createTestUserSession(testEmail);
  await DatabaseTestHelper.createProfile(testEmail);

  // Try to access protected route (triggers redirect with returnUrl)
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login.*returnUrl/);

  // Complete login
  await page.getByLabel('Email Address').fill(testEmail);
  await page.getByLabel('Password').fill('test-password-123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Should redirect back to originally requested route
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
});

test('should maintain authentication across page reload', async ({
  page,
}) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const testEmail = `test-${uniqueId}@example.com`;

  await AuthTestHelper.createTestUserSession(testEmail);
  await DatabaseTestHelper.createProfile(testEmail);

  // Login
  await page.goto('/auth/login');
  await page.getByLabel('Email Address').fill(testEmail);
  await page.getByLabel('Password').fill('test-password-123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

  // Reload page and verify auth persists
  await page.reload();
  await expect(page).toHaveURL('/dashboard');
});
  });

  test.describe('API Authentication', () => {
test('should accept API requests with valid authentication', async ({
  page,
}) => {
  const uniqueId = Math.random().toString(36).substring(7);
  const testEmail = `test-${uniqueId}@example.com`;

  // Create test user and data
  const { userId, token } =
await AuthTestHelper.createTestUserSession(testEmail);
  await DatabaseTestHelper.createProfile(testEmail);
  await DatabaseTestHelper.createTestName(userId, 'Test Name', 'PREFERRED');

  // Test authenticated API request
  const apiResponse = await page.request.get(`/api/names/${userId}`, {
headers: {
  Authorization: `Bearer ${token}`,
},
  });

  expect(apiResponse.status()).toBe(200);
  const apiData = await apiResponse.json();
  expect(apiData.success).toBe(true);
  expect(apiData.data.names).toHaveLength(1);
});

test('should reject API requests without authentication', async ({
  page,
}) => {
  const testUserId = 'non-existent-user-id';

  // Try API request without authentication
  const apiResponse = await page.request.get(`/api/names/${testUserId}`);

  expect(apiResponse.status()).toBe(401);
  const apiData = await apiResponse.json();
  expect(apiData.success).toBe(false);
  expect(apiData.error.message).toContain('authorization token');
});
  });
});
