/**
 * Authentication Test Helpers
 * Simplified functions for demo user authentication in tests
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type DemoPersona = 'JJ' | 'LIWEI' | 'ALEX';

const DEMO_USERS = {
  JJ: { email: 'jj@truename.test', password: 'demo123!' },
  LIWEI: { email: 'liwei@truename.test', password: 'demo123!' },
  ALEX: { email: 'alex@truename.test', password: 'demo123!' },
} as const;

/**
 * Login as a demo user via browser UI
 */
export async function loginAsDemoUser(
  page: Page,
  persona: DemoPersona,
): Promise<void> {
  const user = DEMO_USERS[persona];
  console.log(`🔐 Logging in as ${persona}: ${user.email}`);

  await page.goto('/auth/login');
  await page.getByLabel('Email Address').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  console.log(`✅ Successfully logged in as ${persona}`);
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
