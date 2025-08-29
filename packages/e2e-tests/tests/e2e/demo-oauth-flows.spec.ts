/**
 * Demo OAuth Integration E2E Test - Consolidated
 *
 * Tests the complete OAuth integration flow between TrueNamePath and both Demo HR and Demo Chat.
 * Validates cross-application navigation, OAuth authorization flow, token exchange,
 * callback handling, and comprehensive OIDC claims resolution and display.
 *
 * This consolidated test covers both demo applications to avoid duplication.
 */

import { expect, test } from '@playwright/test';
import { getOrCreateTestUser } from '@/utils/auth-helpers';

// Extended TestUser interface for OIDC claims verification
interface ExtendedTestUser {
  email: string;
  password: string;
  // OIDC properties from signup flow
  given_name: string;
  family_name: string;
  name: string;
  nickname?: string;
  preferred_username?: string;
}

test.describe('Demo OAuth Integration - Consolidated', () => {
  test.use({ actionTimeout: 15000 });

  test('Complete OAuth flow with Demo HR', async ({ page }) => {
console.log('🚀 Starting Demo HR OAuth integration test');

// === PHASE 1: Setup and Navigation ===
const testUser = (await getOrCreateTestUser(page)) as ExtendedTestUser;

// Navigate to Demo HR and initiate OAuth flow
await page.goto('http://localhost:4000');
await expect(page.getByTestId('demo-hr-signin-button')).toBeVisible();
await page.getByTestId('demo-hr-signin-button').click();

console.log('✅ OAuth flow initiated');

// === PHASE 2: Handle OAuth Authorization ===
await page.waitForURL('**/auth/oauth-authorize**', { timeout: 15000 });

// Verify OAuth authorization page and complete authorization
await expect(page.getByTestId('oauth-app-info')).toContainText('Demo Hr');
await expect(page.getByRole('radio', { name: 'Default' })).toBeChecked();
await page.getByTestId('oauth-authorize-button').click();

console.log('✅ OAuth authorization completed');

// === PHASE 3: Handle Callback and Dashboard Redirect ===
await page.waitForURL('http://localhost:4000/callback**', {
  timeout: 15000,
});

await page.waitForURL('http://localhost:4000/dashboard', {
  timeout: 15000,
});

console.log('✅ Reached HR dashboard');

// === PHASE 4: Comprehensive User Data Verification ===
await expect(page.getByTestId('demo-hr-dashboard')).toBeVisible();

// Verify welcome message shows actual user name
await expect(page.getByTestId('demo-hr-employee-name')).toContainText(
  `Welcome, ${testUser.given_name}!`,
);

// Verify all critical OIDC claims are displayed correctly
const criticalFields = [
  { testId: 'demo-hr-name', description: 'Display name' },
  { testId: 'demo-hr-given-name', description: 'Given name' },
  { testId: 'demo-hr-family-name', description: 'Family name' },
  { testId: 'demo-hr-sub', description: 'Subject identifier' },
  { testId: 'demo-hr-context-name', description: 'Context name' },
  { testId: 'demo-hr-app-name', description: 'Application name' },
];

for (const field of criticalFields) {
  const element = page.getByTestId(field.testId);
  await expect(element).toBeVisible();

  // Verify field has non-empty content
  const content = await element.textContent();
  expect(content).toBeTruthy();
  expect(content?.trim()).not.toBe('');
}

// Verify specific expected values for key fields
await expect(page.getByTestId('demo-hr-given-name')).toContainText('Test');
await expect(page.getByTestId('demo-hr-family-name')).toContainText('User');
await expect(page.getByTestId('demo-hr-context-name')).toContainText(
  'Default',
);

console.log('🎉 Demo HR OAuth integration test completed successfully');
  });

  test('Complete OAuth flow with Demo Chat', async ({ page, browserName }) => {
console.log('🚀 Starting Demo Chat OAuth integration test');

// === PHASE 1: Setup and Navigation ===
const testUser = (await getOrCreateTestUser(page)) as ExtendedTestUser;

// Navigate to Demo Chat and initiate OAuth flow
await page.goto('http://localhost:4500');

// Wait for page to fully load, especially important for WebKit
await page.waitForLoadState('networkidle');

await expect(page.getByTestId('demo-chat-signin-button')).toBeVisible();

// Additional stability check for WebKit
if (browserName === 'webkit') {
  await page.waitForTimeout(1000); // Give WebKit extra time to stabilize
}

await page.getByTestId('demo-chat-signin-button').click();

console.log('✅ OAuth flow initiated');

// === PHASE 2: Handle OAuth Authorization ===
await page.waitForURL('**/auth/oauth-authorize**', { timeout: 15000 });

// Verify OAuth authorization page and complete authorization
await expect(page.getByTestId('oauth-app-info')).toContainText('Demo Chat');
await expect(page.getByRole('radio', { name: 'Default' })).toBeChecked();
await page.getByTestId('oauth-authorize-button').click();

console.log('✅ OAuth authorization completed');

// === PHASE 3: Handle Callback and Chat Redirect ===
await page.waitForURL('http://localhost:4500/callback**', {
  timeout: 15000,
});

await page.waitForURL('http://localhost:4500/chat', {
  timeout: 15000,
});

console.log('✅ Reached Chat page');

// === PHASE 4: Comprehensive User Data Verification ===
await expect(page.getByTestId('demo-chat-page')).toBeVisible();

// Verify welcome message shows actual user name
await expect(page.getByTestId('demo-chat-user-name')).toContainText(
  `${testUser.given_name}`,
);

// Verify all critical OIDC claims are displayed correctly
const criticalFields = [
  { testId: 'demo-chat-display-name', description: 'Display name' },
  { testId: 'demo-chat-given-name', description: 'Given name' },
  { testId: 'demo-chat-family-name', description: 'Family name' },
  { testId: 'demo-chat-sub', description: 'Subject identifier' },
  { testId: 'demo-chat-context-name', description: 'Context name' },
  { testId: 'demo-chat-app-name', description: 'Application name' },
];

for (const field of criticalFields) {
  const element = page.getByTestId(field.testId);
  await expect(element).toBeVisible();

  // Verify field has non-empty content
  const content = await element.textContent();
  expect(content).toBeTruthy();
  expect(content?.trim()).not.toBe('');
}

// Verify specific expected values for key fields
await expect(page.getByTestId('demo-chat-given-name')).toContainText(
  'Test',
);
await expect(page.getByTestId('demo-chat-family-name')).toContainText(
  'User',
);
await expect(page.getByTestId('demo-chat-context-name')).toContainText(
  'Default',
);

console.log('🎉 Demo Chat OAuth integration test completed successfully');
  });

  test('OAuth error handling works correctly', async ({ page }) => {
console.log('🚀 Testing OAuth error handling');

const testUser = (await getOrCreateTestUser(page)) as ExtendedTestUser;

// Test with invalid app_name to trigger error
await page.goto(
  '/auth/oauth-authorize?app_name=invalid-app&return_url=http://localhost:3001/callback&state=test',
);

// Should show error page or redirect to error - use specific locator to avoid strict mode violation
// The page shows "Invalid App" in the main content area, which indicates error handling worked
await expect(
  page.getByRole('paragraph').filter({ hasText: /^Invalid App$/ }),
).toBeVisible({ timeout: 10000 });

console.log('✅ OAuth error handling validated');
  });
});
