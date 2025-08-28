/**
 * Playwright Authentication Setup - Global Setup Project
 *
 * This setup file creates an authenticated user session and stores the
 * authentication state for reuse across all tests. This follows Playwright's
 * best practices for authentication state management and significantly improves
 * test performance by avoiding repeated login operations.
 *
 * The setup:
 * 1. Creates a single test user via the signup flow
 * 2. Stores authentication state in playwright/.auth/user.json
 * 3. Stores user credentials in localStorage for test access
 * 4. All subsequent tests start pre-authenticated using this state
 *
 * This enables proper cross-origin OAuth flow testing and eliminates
 * authentication bottlenecks in the test suite.
 */

import { test as setup, expect } from '@playwright/test';
import { createAndLoginTestUser } from '@/utils/auth-helpers';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  console.log('🚀 Starting authentication setup for all tests...');

  // Create and login test user via existing helper
  const testUser = await createAndLoginTestUser(page);

  console.log(`✅ Authentication setup completed for user: ${testUser.email}`);
  console.log(
`📋 User data: ${testUser.given_name} ${testUser.family_name} (${testUser.name})`,
  );
  console.log('📁 Storing authentication state and user data...');

  // Store complete user credentials and OIDC data in localStorage for test access
  await page.evaluate((userData) => {
localStorage.setItem('playwright-test-user', JSON.stringify(userData));
  }, testUser);

  // Verify we're authenticated and on dashboard
  await expect(page).toHaveURL('/dashboard');

  // Store authentication state in file for reuse
  await page.context().storageState({ path: authFile });

  console.log(`✅ Authentication state stored in ${authFile}`);
  console.log(
'🎯 All tests will now start pre-authenticated with complete OIDC data',
  );
  console.log('📊 Expected performance improvement: ~5-10 seconds per test');
});
