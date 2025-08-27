/**
 * Authentication Test Helpers - Simplified
 * Dynamic user creation for clean, isolated tests
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
}

/**
 * Create a test user dynamically via signup flow and login
 */
export async function createAndLoginTestUser(page: Page): Promise<TestUser> {
  const uniqueId = Date.now();
  const email = `test${uniqueId}@e2e.local`;
  const password = 'TestPass123!';

  console.log(`🔐 Creating and logging in test user: ${email}`);

  // Navigate to signup
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');

  // Fill Step 1 form
  await page.getByTestId('signup-email-input').fill(email);
  await page.getByTestId('signup-password-input').fill(password);
  await page.getByTestId('signup-confirm-password-input').fill(password);
  await page.getByTestId('signup-terms-checkbox').check();
  await page.getByTestId('signup-consent-checkbox').check();
  await page.getByTestId('signup-step1-submit').click();

  // Fill Step 2 form (OIDC properties)
  await page.getByTestId('signup-given-name-input').fill('Test');
  await page.getByTestId('signup-family-name-input').fill('User');
  await page
.getByTestId('signup-display-name-input')
.fill(`Test User ${uniqueId}`);
  await page.getByTestId('signup-step2-submit').click();

  // Verify successful signup and redirect to dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  console.log(`✅ Successfully created and logged in test user: ${email}`);

  return { email, password };
}

/**
 * Create a test context for tests that need one
 */
export async function createTestContext(
  page: Page,
  name: string,
): Promise<void> {
  console.log(`📁 Creating test context: ${name}`);

  await page.goto('/dashboard/contexts');
  await page.waitForLoadState('networkidle');

  // Check if we're already on the contexts page or need to navigate
  const currentUrl = page.url();
  if (!currentUrl.includes('/contexts')) {
await page.getByTestId('tab-contexts').click();
  }

  // Look for create context button (may have different text/selectors)
  const createButton = page
.locator('button')
.filter({ hasText: /create|add/i })
.first();
  if (await createButton.isVisible({ timeout: 5000 })) {
await createButton.click();

// Use specific test ID instead of generic label
await page.getByTestId('context-name-input').fill(name);

// Submit
const submitButton = page
  .locator('button')
  .filter({ hasText: /create|save|submit/i })
  .first();
await submitButton.click();

// Wait for success notification or context to appear in the list
try {
  // Wait for either success notification or the context to appear
  await Promise.race([
page.waitForSelector('text=Context Created', { timeout: 5000 }),
page.waitForSelector('text=Context created successfully', {
  timeout: 5000,
}),
  ]);

  // Additional wait to ensure the context list has been updated
  await page.waitForTimeout(1000);

  console.log(`✅ Created test context: ${name}`);
} catch (error) {
  console.log(
`⚠️  Context creation may have failed or taken longer than expected: ${error}`,
  );
}
  } else {
console.log(
  `⚠️  Could not find create context button, context may already exist`,
);
  }
}

/**
 * Logout user via browser UI
 */
export async function logout(page: Page): Promise<void> {
  try {
await page.goto('/dashboard/settings');

// Wait for page to load completely
await page.waitForLoadState('domcontentloaded');
await page.waitForLoadState('networkidle');

const logoutButton = page.getByRole('button', {
  name: /sign out|logout/i,
});

if (await logoutButton.isVisible({ timeout: 5000 })) {
  await logoutButton.click();

  // Wait for logout to complete - more robust waiting
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL('/auth/login', { timeout: 15000 });

  // Additional wait for webkit stability
  if (page.context().browser()?.browserType().name() === 'webkit') {
await page.waitForTimeout(1000);
  }

  console.log('✅ Successfully logged out');
} else {
  console.warn('⚠️  Logout button not found, forcing redirect');
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
}
  } catch (error) {
console.warn('⚠️  Logout failed, forcing redirect:', error);
await page.goto('/auth/login');
await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Check if user is authenticated in browser
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
// Check if page is still accessible
if (page.isClosed()) {
  return false;
}

await page.goto('/dashboard');
await page.waitForLoadState('domcontentloaded');
await expect(page).toHaveURL('/dashboard', { timeout: 3000 });
return true;
  } catch {
return false;
  }
}

/**
 * Ensure clean authentication state for tests
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  console.log('🧹 Ensuring logged out state...');

  // Check if page is still accessible
  if (page.isClosed()) {
throw new Error('Page is closed - cannot ensure logged out state');
  }

  try {
// Check current authentication state
const isAuth = await isAuthenticated(page);
if (isAuth) {
  console.log('🔓 User is authenticated, logging out...');
  await logout(page);
}
  } catch (error) {
console.warn('⚠️  Error during logout check, forcing clean state:', error);
  }

  // Always go to login page to ensure clean state
  try {
await page.goto('/auth/login');
await page.waitForLoadState('domcontentloaded');
console.log('✅ Logged out state confirmed');
  } catch (error) {
console.error('❌ Failed to ensure logged out state:', error);
throw error;
  }
}
