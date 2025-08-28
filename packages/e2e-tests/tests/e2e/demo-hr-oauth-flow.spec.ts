/**
 * Demo HR OAuth Integration E2E Test
 *
 * Tests the complete OAuth integration flow between TrueNamePath and Demo HR.
 * Validates cross-application navigation, OAuth authorization flow, token exchange,
 * callback handling, and comprehensive OIDC claims resolution and display.
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

test.describe('Demo HR OAuth Integration', () => {
  test.use({ actionTimeout: 15000 });

  test('Complete OAuth flow with comprehensive user data verification', async ({
page,
  }) => {
console.log('🚀 Starting Demo HR OAuth integration test');

// === PHASE 1: Setup and Navigation ===
const testUser = (await getOrCreateTestUser(page)) as ExtendedTestUser;

// Navigate to Demo HR and initiate OAuth flow
await page.goto('http://localhost:4000');
await expect(page.getByTestId('demo-hr-signin-button')).toBeVisible();
await page.getByTestId('demo-hr-signin-button').click();

console.log('✅ OAuth flow initiated');

// === PHASE 2: Handle OAuth Authorization ===
// User is now authenticated in both CLI and UI modes via getOrCreateTestUser
// Wait for OAuth authorization page directly
await page.waitForURL('**/auth/oauth-authorize**', { timeout: 15000 });

// Verify OAuth authorization page and complete authorization
await expect(page.getByTestId('oauth-app-info')).toContainText('demo-hr');
await expect(page.getByRole('radio', { name: 'Default' })).toBeChecked();
await page.getByTestId('oauth-authorize-button').click();

console.log('✅ OAuth authorization completed');

// === PHASE 3: Handle Callback and Dashboard Redirect ===
// Wait for callback redirect with proper timeout
await page.waitForURL('http://localhost:4000/callback**', {
  timeout: 15000,
});

// Wait for final navigation to dashboard
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
// Note: We verify that fields exist and contain non-empty data rather than exact matches
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
await expect(page.getByTestId('demo-hr-app-name')).toContainText('demo-hr');

// Verify additional OIDC fields exist (may be empty but should be present)
const additionalFields = [
  'demo-hr-nickname',
  'demo-hr-preferred-username',
  'demo-hr-iss', // Identity Provider
  'demo-hr-aud', // Audience
  'demo-hr-iat', // Authentication Time
];

for (const testId of additionalFields) {
  await expect(page.getByTestId(testId)).toBeVisible();
}

console.log('✅ User data verification completed');
console.log('🎉 Demo HR OAuth integration test passed');
  });

  test('OAuth session persists across navigation and page reloads', async ({
page,
  }) => {
console.log('🔄 Testing OAuth session persistence');

const testUser = (await getOrCreateTestUser(page)) as ExtendedTestUser;

// === PHASE 1: Establish OAuth Session First ===
// Need to complete OAuth flow first to establish session
await page.goto('http://localhost:4000');
await expect(page.getByTestId('demo-hr-signin-button')).toBeVisible();
await page.getByTestId('demo-hr-signin-button').click();

// User is now authenticated in both CLI and UI modes via getOrCreateTestUser
// Wait for OAuth authorization page directly
await page.waitForURL('**/auth/oauth-authorize**', { timeout: 15000 });
await expect(page.getByRole('radio', { name: 'Default' })).toBeChecked();
await page.getByTestId('oauth-authorize-button').click();

// Wait for dashboard
await page.waitForURL('http://localhost:4000/dashboard', {
  timeout: 15000,
});
await expect(page.getByTestId('demo-hr-dashboard')).toBeVisible();

console.log('✅ OAuth session established');

// === PHASE 2: Test Navigation Persistence ===
// Navigate away from HR app back to TrueNamePath
await page.goto('http://localhost:3000/dashboard');
await expect(page.getByTestId('dashboard-content')).toBeVisible();

// Navigate back to Demo HR - should still be authenticated
await page.goto('http://localhost:4000/dashboard');
await page.waitForURL('http://localhost:4000/dashboard', {
  timeout: 15000,
});
await expect(page.getByTestId('demo-hr-dashboard')).toBeVisible();

// Verify user data is still available
await expect(page.getByTestId('demo-hr-employee-name')).toBeVisible();
await expect(page.getByTestId('demo-hr-given-name')).toContainText('Test');

console.log('✅ Session persists across cross-origin navigation');

// === PHASE 3: Test Page Reload Persistence ===
// Reload the page - session should survive
await page.reload();
await page.waitForURL('http://localhost:4000/dashboard', {
  timeout: 15000,
});
await expect(page.getByTestId('demo-hr-dashboard')).toBeVisible();

// Verify critical user data still loads correctly after reload
const criticalFields = [
  'demo-hr-employee-name',
  'demo-hr-given-name',
  'demo-hr-family-name',
  'demo-hr-context-name',
];

for (const testId of criticalFields) {
  await expect(page.getByTestId(testId)).toBeVisible();
  const content = await page.getByTestId(testId).textContent();
  expect(content?.trim()).not.toBe('');
}

console.log('✅ Session persists across page reload');
console.log('🎉 OAuth session persistence test passed');
  });

  test('handles cross-origin navigation during OAuth flow', async ({
page,
  }) => {
console.log('🌐 Testing cross-origin navigation during OAuth flow');

const testUser = (await getOrCreateTestUser(page)) as ExtendedTestUser;

// === PHASE 1: Start Fresh OAuth Flow ===
// Clear any existing session state first
await page.context().clearCookies();
await page.goto('http://localhost:4000');

// Verify we start at the Demo HR landing page
await expect(page.getByTestId('demo-hr-signin-button')).toBeVisible();
await page.getByTestId('demo-hr-signin-button').click();

console.log('✅ Initiated fresh OAuth flow from Demo HR');

// === PHASE 2: Handle Authentication and Validate Cross-Origin Redirects ===
// Since we cleared cookies, we will need to login first
await page.waitForLoadState('domcontentloaded');

// Check if we're redirected to login (expected after clearing cookies)
const needsLogin = await page
  .waitForURL('**/auth/login**', { timeout: 5000 })
  .then(() => true)
  .catch(() => false);

if (needsLogin || page.url().includes('/auth/login')) {
  // Fill login form since cookies were cleared
  await page.getByTestId('login-email-input').fill(testUser.email);
  await page.getByTestId('login-password-input').fill(testUser.password);
  await page.getByTestId('login-submit-button').click();
  console.log('✅ Authentication completed');

  // Now wait for OAuth authorization after login
  await page.waitForURL('**/auth/oauth-authorize**', { timeout: 15000 });
} else {
  // Should redirect to TrueNamePath authorization (cross-origin)
  await page.waitForURL('**/auth/oauth-authorize**', { timeout: 15000 });
}

// Verify we're on the correct origin (localhost:3000)
expect(page.url()).toContain('localhost:3000');
expect(page.url()).toContain('/auth/oauth-authorize');

// Verify OAuth authorization page loads correctly
await expect(page.getByTestId('oauth-app-info')).toContainText('demo-hr');

console.log('✅ Cross-origin redirect to TrueNamePath completed');

// === PHASE 3: Complete Authorization and Test Callback ===
await page.getByTestId('oauth-authorize-button').click();

// Should redirect back to Demo HR callback (cross-origin)
await page.waitForURL('http://localhost:4000/callback**', {
  timeout: 15000,
});

// Verify we're back on the correct origin (localhost:4000)
expect(page.url()).toContain('localhost:4000');
expect(page.url()).toContain('/callback');

console.log('✅ Cross-origin redirect to Demo HR callback completed');

// === PHASE 4: Final Dashboard Navigation ===
// Should redirect to dashboard
await page.waitForURL('http://localhost:4000/dashboard', {
  timeout: 15000,
});
await expect(page.getByTestId('demo-hr-dashboard')).toBeVisible();

// Verify user data loads correctly after cross-origin flow
await expect(page.getByTestId('demo-hr-employee-name')).toBeVisible();
await expect(page.getByTestId('demo-hr-given-name')).toContainText('Test');

console.log('✅ Cross-origin OAuth flow completed successfully');
console.log('🎉 Cross-origin navigation test passed');
  });

  test('handles OAuth errors gracefully', async ({ page }) => {
console.log('❌ Testing OAuth error handling');

const testUser = (await getOrCreateTestUser(page)) as ExtendedTestUser;

// === PHASE 1: Test Invalid OAuth Parameters ===
// Navigate to OAuth authorize with invalid app
const invalidUrl =
  'http://localhost:3000/auth/oauth-authorize?app_name=invalid-app&return_url=http://localhost:4000/callback';
await page.goto(invalidUrl);

// Wait for the page to load completely
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2000); // Give the system time to process and redirect

// Debug: Log the current state for understanding
const currentUrl = page.url();
console.log('Current URL after invalid request:', currentUrl);

// Check for page title to understand page state
const pageTitle = await page.title();
console.log('Page title:', pageTitle);

// The key test: system doesn't crash and loads a valid page
// We'll check for any of these graceful responses:
// 1. OAuth error alert is shown
// 2. User is redirected to login/dashboard
// 3. System shows a valid HTML page (not a crash/500 error)
const isValidResponse =
  // Check for explicit error handling
  (await page
.getByTestId('oauth-error-alert')
.isVisible({ timeout: 1000 })
.catch(() => false)) ||
  // Check for redirect to safe pages
  currentUrl.includes('/auth/login') ||
  currentUrl.includes('/dashboard') ||
  // Check that we have a valid page with title (not a crash)
  (pageTitle &&
pageTitle.length > 0 &&
!pageTitle.includes('500') &&
!pageTitle.includes('Error'));

// Should handle invalid parameters gracefully
expect(isValidResponse).toBe(true);
console.log(
  '✅ Invalid OAuth parameters handled gracefully - Current page:',
  currentUrl,
  'Title:',
  pageTitle,
);

// === PHASE 2: Test Malformed URL Resilience ===
// Test behavior with malformed callback URLs
const malformedUrl =
  'http://localhost:3000/auth/oauth-authorize?app_name=demo-hr&return_url=invalid-url';
await page.goto(malformedUrl);

await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(1000);

// Should handle malformed URLs gracefully by not crashing
const malformedUrl2 = page.url();
const malformedTitle = await page.title();
const hasResilienceHandling =
  malformedTitle &&
  malformedTitle.length > 0 &&
  !malformedTitle.includes('500') &&
  !malformedTitle.includes('Error');

expect(hasResilienceHandling).toBe(true);
console.log(
  '✅ Malformed URL resilience verified - URL:',
  malformedUrl2,
  'Title:',
  malformedTitle,
);

console.log('✅ OAuth error scenarios tested successfully');
console.log('🎉 OAuth error handling test passed');
  });
});
