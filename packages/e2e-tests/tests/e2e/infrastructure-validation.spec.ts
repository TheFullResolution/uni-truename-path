/**
 * Infrastructure Validation Test
 *
 * Validates that the simplified test infrastructure is working correctly
 * and provides a foundation example for future tests.
 */

import {
  ensureLoggedOut,
  createAndLoginTestUser,
  logout,
} from '@/utils/auth-helpers';
import { expect, test } from '@playwright/test';

test.describe('Test Infrastructure Validation', () => {
  test.beforeEach(async ({ page }) => {
// Ensure clean state before each test
await ensureLoggedOut(page);
  });

  test('should handle multiple dynamic users', async ({ page }) => {
// Test creating and logging in with first user
const user1 = await createAndLoginTestUser(page);
await expect(page).toHaveURL('/dashboard');
console.log(`✅ First user login successful: ${user1.email}`);

await logout(page);
await expect(page).toHaveURL('/auth/login');
console.log('✅ Logout successful');

// Test creating and logging in with second user
const user2 = await createAndLoginTestUser(page);
await expect(page).toHaveURL('/dashboard');
console.log(`✅ Second user login successful: ${user2.email}`);

// Verify users are different
expect(user1.email).not.toBe(user2.email);
console.log('✅ Dynamic user isolation confirmed');
  });
});

test.describe('Basic Application Access', () => {
  test('should access dashboard after authentication', async ({ page }) => {
const testUser = await createAndLoginTestUser(page);

// Verify we can reach the dashboard (basic connectivity test)
await expect(page).toHaveURL('/dashboard');
await expect(page.locator('body')).not.toHaveText(/error|failed/i);

console.log(`✅ Basic dashboard access verified for: ${testUser.email}`);
  });
});
