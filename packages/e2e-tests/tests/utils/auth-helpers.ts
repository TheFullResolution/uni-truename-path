/**
 * Authentication Test Helpers - Optimized with Authentication Setup
 *
 * This module provides authentication utilities following Playwright best practices:
 *
 * AUTHENTICATION SETUP PATTERN:
 * - auth.setup.ts creates ONE test user and stores authentication state
 * - All tests start pre-authenticated using stored state (playwright/.auth/user.json)
 * - Use getStoredTestUser() to access the shared test user credentials
 * - Only use createAndLoginTestUser() for signup flow tests or special cases
 *
 * PERFORMANCE OPTIMIZATION:
 * - 5-10 second improvement per test by skipping repetitive login flows
 * - Enables proper cross-origin OAuth testing by maintaining persistent sessions
 * - Single worker ensures database consistency while maximizing authentication reuse
 *
 * Dynamic user creation for clean, isolated tests
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  // OIDC properties from signup flow
  given_name?: string;
  family_name?: string;
  name?: string;
  nickname?: string;
  preferred_username?: string;
}

/**
 * Create a test user dynamically via signup flow and login
 */
export async function createAndLoginTestUser(page: Page): Promise<TestUser> {
  const uniqueId = Date.now();
  const email = `test${uniqueId}@e2e.local`;
  const password = 'TestPass123!';
  const given_name = 'Test';
  const family_name = 'User';
  const name = `Test User ${uniqueId}`;

  console.log(`🔐 Creating and logging in test user: ${email}`);

  // Navigate to signup
  await page.goto('/auth/signup');
  // Wait for the signup form to be ready
  await page.waitForSelector('[data-testid="signup-email-input"]', {
state: 'visible',
timeout: 30000,
  });

  // Fill Step 1 form
  await page.getByTestId('signup-email-input').fill(email);
  await page.getByTestId('signup-password-input').fill(password);
  await page.getByTestId('signup-confirm-password-input').fill(password);
  await page.getByTestId('signup-terms-checkbox').check();
  await page.getByTestId('signup-consent-checkbox').check();
  await page.getByTestId('signup-step1-submit').click();

  // Fill Step 2 form (OIDC properties)
  await page.getByTestId('signup-given-name-input').fill(given_name);
  await page.getByTestId('signup-family-name-input').fill(family_name);
  await page.getByTestId('signup-display-name-input').fill(name);
  await page.getByTestId('signup-step2-submit').click();

  // Verify successful signup and redirect to dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  console.log(`✅ Successfully created and logged in test user: ${email}`);

  return {
email,
password,
given_name,
family_name,
name,
  };
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
  // Wait for contexts page to load
  await page.waitForSelector('[data-testid="tab-contexts"]', {
timeout: 30000,
  });

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
// Wait for settings page to be ready
await page.waitForSelector('[data-testid="tab-settings"]', {
  timeout: 30000,
});

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
 * Get stored test user from setup OR create a new one (for both CLI and UI modes)
 */
export async function getOrCreateTestUser(page: Page): Promise<TestUser> {
  try {
// Try to get stored user first (CLI mode with setup project)
const storedUser = await getStoredTestUser(page);

// Verify the user is actually authenticated by checking if dashboard is accessible
await page.goto('/dashboard');
await page.waitForLoadState('domcontentloaded');

// If we're redirected to login, authentication is not working
if (page.url().includes('/auth/login')) {
  console.log(
'🔄 Stored user found but authentication not working, creating new user...',
  );
  return await createAndLoginTestUser(page);
}

console.log(`🔑 Using stored authenticated user: ${storedUser.email}`);
return storedUser;
  } catch (error) {
// No stored user found (UI mode), create a new one
console.log(
  '📝 No stored user found, creating new test user for UI mode...',
);
return await createAndLoginTestUser(page);
  }
}

/**
 * Get stored test user from setup (for tests using authentication state)
 */
export async function getStoredTestUser(page: Page): Promise<TestUser> {
  try {
// Ensure we're on the right origin to access localStorage
await page.goto('/dashboard');
await page.waitForLoadState('domcontentloaded');

const userData = await page.evaluate(() => {
  const stored = localStorage.getItem('playwright-test-user');
  return stored ? JSON.parse(stored) : null;
});

if (!userData || !userData.email || !userData.password) {
  throw new Error(
'No test user found in storage. Auth setup may have failed.',
  );
}

console.log(`🔑 Retrieved stored test user: ${userData.email}`);
return userData;
  } catch (error) {
console.error('❌ Failed to retrieve stored test user:', error);
throw error;
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
