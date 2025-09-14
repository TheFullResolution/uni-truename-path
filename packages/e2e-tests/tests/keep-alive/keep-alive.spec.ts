import { test, expect, type Page } from '@playwright/test';
import { logout, ensureLoggedOut } from '../utils/auth-helpers';
import { createContext } from '../utils/context-helpers';

/**
 * Keep-alive test for Supabase project maintenance
 *
 * This test performs basic operations on the production dashboard to keep
 * the Supabase project active during the review period. It:
 * 1. Logs into persistent test user account
 * 2. Creates a test context
 * 3. Verifies the context exists
 * 4. Cleans up by deleting the context
 * 5. Logs out cleanly
 *
 * Uses a persistent test user account with credentials stored in GitHub Secrets.
 * Designed to run weekly via GitHub Actions to prevent Supabase project
 * from being paused due to inactivity.
 */
test.describe('Supabase Keep-Alive', () => {
  test('should perform basic dashboard operations to maintain project activity', async ({
page,
  }) => {
const testContextName = `KeepAlive-${Date.now()}`;

// Get test user credentials from environment variables
const testEmail = process.env.KEEP_ALIVE_TEST_EMAIL;
const testPassword = process.env.KEEP_ALIVE_TEST_PASSWORD;

if (!testEmail || !testPassword) {
  throw new Error(
'Missing test user credentials. Please set KEEP_ALIVE_TEST_EMAIL and KEEP_ALIVE_TEST_PASSWORD environment variables.',
  );
}

try {
  // Step 1: Login with persistent test user
  console.log(`🔄 Logging in as test user: ${testEmail}`);
  await loginTestUser(page, testEmail, testPassword);
  console.log(`✅ Successfully logged in as: ${testEmail}`);

  // Step 2: Verify we're on the dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  console.log('✅ Successfully reached dashboard');

  // Step 3: Create a test context
  console.log(`🔄 Creating test context: ${testContextName}`);
  const contextCreated = await createContext(
page,
testContextName,
'Keep-alive test context - safe to delete',
  );

  if (!contextCreated) {
throw new Error('Failed to create test context');
  }
  console.log(`✅ Test context created: ${testContextName}`);

  // Step 4: Verify the context appears in the list
  await page.goto('/dashboard/contexts');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  const contextCard = page.locator(`[data-testid*="context-card"]`).filter({
hasText: testContextName,
  });

  await expect(contextCard).toBeVisible({ timeout: 10000 });
  console.log(`✅ Verified context exists in dashboard`);

  // Step 5: Clean up - Delete the test context
  console.log(`🔄 Cleaning up test context: ${testContextName}`);
  await deleteTestContext(page, testContextName);
  console.log(`✅ Test context deleted: ${testContextName}`);

  // Step 6: Final verification - ensure we can still navigate
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  console.log('✅ Keep-alive operations completed successfully');

  // Step 7: Clean logout
  console.log('🔄 Logging out...');
  await logout(page);
  console.log('✅ Successfully logged out');
} catch (error) {
  console.error('❌ Keep-alive test failed:', error);

  // Try to clean up even if test failed
  if (testContextName) {
try {
  await deleteTestContext(page, testContextName);
  console.log('✅ Context cleanup completed after error');
} catch (cleanupError) {
  console.warn('⚠️ Context cleanup failed:', cleanupError);
}
  }

  // Try to logout even if test failed
  try {
await logout(page);
console.log('✅ Logged out after error');
  } catch (logoutError) {
console.warn('⚠️ Logout failed:', logoutError);
  }

  throw error;
} finally {
  console.log('🏁 Keep-alive test completed');
}
  });
});

/**
 * Helper function to login with test user credentials
 */
async function loginTestUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  try {
// Ensure we start from a clean state
await ensureLoggedOut(page);

// Navigate to login page
await page.goto('/auth/login');
await page.waitForLoadState('networkidle', { timeout: 15000 });

// Wait for login form to be visible
await page.waitForSelector('[data-testid="login-email-input"]', {
  state: 'visible',
  timeout: 15000,
});

// Fill in credentials
await page.getByTestId('login-email-input').fill(email);
await page.getByTestId('login-password-input').fill(password);

// Submit login form
await page.getByTestId('login-submit-button').click();

// Wait for redirect to dashboard
await expect(page).toHaveURL('/dashboard', { timeout: 20000 });

// Wait for dashboard to fully load
await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch (error) {
throw new Error(`Login failed for ${email}: ${error}`);
  }
}

/**
 * Helper function to delete a test context
 */
async function deleteTestContext(
  page: Page,
  contextName: string,
): Promise<void> {
  try {
await page.goto('/dashboard/contexts');
await page.waitForLoadState('networkidle', { timeout: 15000 });

// Find the context card
const contextCard = page.locator(`[data-testid*="context-card"]`).filter({
  hasText: contextName,
});

if (await contextCard.isVisible({ timeout: 5000 })) {
  // Look for delete/remove button within the context card
  const deleteButton = contextCard
.locator('button')
.filter({
  hasText: /delete|remove|trash/i,
})
.or(contextCard.locator('[data-testid*="delete"]'))
.or(contextCard.locator('[aria-label*="delete" i]'))
.first();

  if (await deleteButton.isVisible({ timeout: 3000 })) {
await deleteButton.click();

// Handle confirmation dialog if it appears
const confirmButton = page
  .locator('button')
  .filter({
hasText: /confirm|delete|yes|remove/i,
  })
  .first();

if (await confirmButton.isVisible({ timeout: 5000 })) {
  await confirmButton.click();
}

await page.waitForTimeout(2000);
console.log(`✅ Context deleted: ${contextName}`);
  } else {
console.log(`⚠️ Delete button not found for context: ${contextName}`);
  }
} else {
  console.log(`⚠️ Context not found for deletion: ${contextName}`);
}
  } catch (error) {
console.warn(`⚠️ Failed to delete context ${contextName}:`, error);
// Don't throw - this is cleanup, not critical
  }
}
