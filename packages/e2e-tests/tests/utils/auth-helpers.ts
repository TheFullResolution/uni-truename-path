// Authentication Test Helpers

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  nickname?: string;
  preferred_username?: string;
}

/**
 * Create a test user and login
 */
export async function createAndLoginTestUser(page: Page): Promise<TestUser> {
  const uniqueId = Date.now();
  const email = `test${uniqueId}@e2e.local`;
  const password = 'TestPass123!';
  const given_name = 'Test';
  const family_name = 'User';
  const name = `Test User ${uniqueId}`;

  console.log(`🔐 Creating and logging in test user: ${email}`);

  await ensureLoggedOut(page);
  await page.goto('/auth/signup');
  await page.waitForSelector('[data-testid="signup-email-input"]', {
state: 'visible',
timeout: 30000,
  });
  await page.getByTestId('signup-email-input').fill(email);
  await page.getByTestId('signup-password-input').fill(password);
  await page.getByTestId('signup-confirm-password-input').fill(password);
  await page.getByTestId('signup-terms-checkbox').check();
  await page.getByTestId('signup-consent-checkbox').check();
  await page.getByTestId('signup-step1-submit').click();
  await page.getByTestId('signup-given-name-input').fill(given_name);
  await page.getByTestId('signup-family-name-input').fill(family_name);
  await page.getByTestId('signup-display-name-input').fill(name);
  await page.getByTestId('signup-step2-submit').click();

  await expect(page).toHaveURL('/auth/login?signup=success', {
timeout: 15000,
  });
  console.log(`✅ Successfully created test user: ${email}, now logging in...`);
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();

  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  console.log(`✅ Successfully logged in test user: ${email}`);

  return {
email,
password,
given_name,
family_name,
name,
  };
}

/**
 * Create a test context
 */
export async function createTestContext(
  page: Page,
  name: string,
): Promise<void> {
  console.log(`📁 Creating test context: ${name}`);

  await page.goto('/dashboard/contexts');
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForSelector('[data-testid="tab-contexts"]', {
timeout: 30000,
  });
  await page.waitForTimeout(1000);
  let createButton = page.getByRole('button', { name: /add context/i });

  if (!(await createButton.isVisible({ timeout: 5000 }))) {
createButton = page
  .locator('button')
  .filter({ hasText: /add context/i })
  .first();
  }

  if (!(await createButton.isVisible({ timeout: 5000 }))) {
createButton = page
  .locator('button')
  .filter({ hasText: /add context/i })
  .or(page.locator('text=Add Context'))
  .first();
  }

  if (!(await createButton.isVisible({ timeout: 5000 }))) {
createButton = page.getByTestId('add-context-button');
  }

  if (!(await createButton.isVisible({ timeout: 8000 }))) {
throw new Error(`Create context button not found for context: ${name}`);
  }

  await createButton.click();

  await page.waitForSelector('[data-testid="context-name-input"]', {
timeout: 10000,
  });
  await page.getByTestId('context-name-input').fill(name);

  let submitButton = page
.locator('button')
.filter({ hasText: /create context|update context|create|save|submit/i })
.first();

  await expect(submitButton).toBeVisible({ timeout: 10000 });
  await expect(submitButton).toBeEnabled({ timeout: 5000 });

  await submitButton.click();

  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');

  console.log(`✅ Created test context: ${name}`);
}

/**
 * Logout user
 */
export async function logout(page: Page): Promise<void> {
  try {
await page.goto('/dashboard/settings');

await page.waitForLoadState('domcontentloaded');
await page.waitForSelector('[data-testid="tab-settings"]', {
  timeout: 30000,
});

let logoutButton = page.getByTestId('sign-out-button');

if (!(await logoutButton.isVisible({ timeout: 2000 }))) {
  logoutButton = page.getByRole('button', {
name: /sign out|logout/i,
  });
}

if (await logoutButton.isVisible({ timeout: 5000 })) {
  await logoutButton.click();

  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL('/auth/login', { timeout: 15000 });

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
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
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
 * Get stored test user or create a new one
 */
export async function getOrCreateTestUser(page: Page): Promise<TestUser> {
  try {
const storedUser = await getStoredTestUser(page);

await page.goto('/dashboard');
await page.waitForLoadState('domcontentloaded');

if (page.url().includes('/auth/login')) {
  console.log(
'🔄 Stored user found but authentication not working, creating new user...',
  );
  return await createAndLoginTestUser(page);
}

console.log(`🔑 Using stored authenticated user: ${storedUser.email}`);
return storedUser;
  } catch (error) {
console.log(
  '📝 No stored user found, creating new test user for UI mode...',
);
return await createAndLoginTestUser(page);
  }
}

/**
 * Get stored test user from setup
 */
export async function getStoredTestUser(page: Page): Promise<TestUser> {
  try {
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
 * Ensure clean authentication state
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  console.log('🧹 Ensuring logged out state...');

  if (page.isClosed()) {
throw new Error('Page is closed - cannot ensure logged out state');
  }

  try {
const isAuth = await isAuthenticated(page);
if (isAuth) {
  console.log('🔓 User is authenticated, logging out...');
  await logout(page);
}
  } catch (error) {
console.warn('⚠️  Error during logout check, forcing clean state:', error);
  }

  try {
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});

const context = page.context();
await context.clearCookies();

console.log('🧹 Cleared browser storage and cookies');
  } catch (error) {
console.warn('⚠️  Error clearing browser storage:', error);
  }

  try {
await page.goto('/auth/login');
await page.waitForLoadState('domcontentloaded');
console.log('✅ Logged out state confirmed');
  } catch (error) {
console.error('❌ Failed to ensure logged out state:', error);
throw error;
  }
}
