/**
 * Dashboard Layout and Navigation Test
 *
 * Efficient, unified test suite for dashboard tabs and navigation.
 * Uses single login/logout cycle and dynamic tab discovery for optimal performance.
 */

import {
  getOrCreateTestUser,
  ensureLoggedOut,
  type TestUser,
} from '@/utils/auth-helpers';
import { expect, test } from '@playwright/test';

// Expected dashboard tabs based on code analysis
const EXPECTED_TABS = [
  'dashboard',
  'contexts',
  'names',
  'connected-apps',
  'settings',
];

test.describe('Dashboard Layout and Navigation', () => {
  test.describe('Authenticated Dashboard Tests', () => {
test.beforeEach(async ({ page }) => {
  // Ensure authenticated for UI mode compatibility
  const user = await getOrCreateTestUser(page);
  console.log(`✅ Using authenticated test user: ${user.email}`);
});

test('should discover and verify all expected dashboard tabs', async ({
  page,
  browserName,
}) => {
  // Mark test as slow for WebKit specifically
  test.slow(
browserName === 'webkit',
'WebKit needs more time for authentication',
  );
  // Navigate to dashboard - authentication handled by beforeEach
  await page.goto('/dashboard');
  // Wait for authentication check to complete and dashboard to load
  await page.waitForFunction(
() => !document.body.textContent?.includes('Checking authentication'),
{ timeout: 30000 },
  );
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

  // Discover all available tabs dynamically
  const tabElements = await page.locator('[data-testid^="tab-"]').all();
  expect(tabElements.length).toBeGreaterThan(0);

  // Extract tab names and verify expected tabs are present
  const discoveredTabs: string[] = [];
  for (const tab of tabElements) {
const testId = await tab.getAttribute('data-testid');
if (testId) {
  const tabName = testId.replace('tab-', '');
  discoveredTabs.push(tabName);
}
  }

  console.log(`🔍 Discovered tabs: ${discoveredTabs.join(', ')}`);

  // Verify all expected tabs are present
  for (const expectedTab of EXPECTED_TABS) {
expect(discoveredTabs).toContain(expectedTab);
  }

  console.log(
`✅ All ${EXPECTED_TABS.length} expected tabs discovered and verified`,
  );
});

test('should navigate between tabs and verify content updates', async ({
  page,
}) => {
  // Navigate to dashboard - authentication handled by beforeEach
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  // Wait for dashboard tabs to be available
  await page.waitForSelector('[data-testid^="tab-"]', { timeout: 30000 });

  // Combined test: navigation + content verification for better efficiency
  const tabTests = [
{
  tab: 'contexts',
  expectedUrl: '/dashboard/contexts',
  contentCheck: /context|Context/i,
},
{
  tab: 'names',
  expectedUrl: '/dashboard/names',
  contentCheck: /name|Name/i,
},
{
  tab: 'connected-apps',
  expectedUrl: '/dashboard/connected-apps',
  contentCheck: /app|App|connected|Connected|oauth|OAuth/i,
},
{
  tab: 'settings',
  expectedUrl: '/dashboard/settings',
  contentCheck: /settings|Settings/i,
},
{
  tab: 'dashboard',
  expectedUrl: '/dashboard',
  contentCheck: /dashboard|Dashboard/i,
}, // Return to home
  ];

  for (const { tab, expectedUrl, contentCheck } of tabTests) {
console.log(`🖱️  Testing tab: ${tab}`);

// Click the tab
await page.click(`[data-testid="tab-${tab}"]`);

// Verify URL changed
await expect(page).toHaveURL(expectedUrl, { timeout: 5000 });

// Verify active tab state
const tabElement = page.locator(`[data-testid="tab-${tab}"]`);
const isActive = await tabElement.evaluate((el) => {
  return (
el.getAttribute('aria-selected') === 'true' ||
el.classList.contains('active') ||
el.hasAttribute('data-active') ||
getComputedStyle(el).fontWeight === 'bold' ||
getComputedStyle(el).fontWeight === '700'
  );
});
expect(isActive).toBeTruthy();

// Wait for content to load and verify it's not empty
await page.waitForFunction(() => document.body.innerText.length > 100, {
  timeout: 30000,
});

// Verify page content loaded (no errors) and has expected content
await expect(page.locator('body')).not.toHaveText(/error|failed|404/i);
await expect(page.locator('body')).not.toBeEmpty();

const hasExpectedContent =
  (await page.locator(`text=${contentCheck}`).count()) > 0;
expect(hasExpectedContent).toBeTruthy();

console.log(
  `✅ Tab "${tab}" navigation, activation, and content verified`,
);
  }
});

test('should handle edge cases and invalid routes', async ({ page }) => {
  // Navigate to dashboard - authentication handled by beforeEach
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

  // Test invalid dashboard route
  await page.goto('/dashboard/nonexistent');

  // Should either redirect to valid page or show proper error handling
  const currentUrl = page.url();
  const isValidRedirect =
currentUrl.includes('/dashboard') &&
!currentUrl.includes('/nonexistent');
  const bodyText = await page.locator('body').textContent();
  const hasProperErrorHandling =
bodyText?.toLowerCase().includes('not found') ||
bodyText?.toLowerCase().includes('404') ||
isValidRedirect;

  expect(hasProperErrorHandling).toBeTruthy();

  // If we got a 404 or error page, navigate back to dashboard first
  if (!isValidRedirect) {
await page.goto('/dashboard');
await expect(page).toHaveURL('/dashboard');
  }

  // Test that we can navigate to valid tabs after invalid route
  await page.waitForSelector('[data-testid="tab-dashboard"]', {
timeout: 5000,
  });
  await page.click('[data-testid="tab-dashboard"]');
  await expect(page).toHaveURL('/dashboard');

  console.log('✅ Edge cases and invalid routes handled gracefully');
});
  });

  test.describe('Unauthenticated Access Tests', () => {
test('should prevent unauthenticated access', async ({ page }) => {
  // Test unauthenticated access without beforeEach authentication
  await ensureLoggedOut(page);

  // Try to access dashboard directly
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Allow redirects to complete

  // Should be redirected to login or show authentication error
  const currentUrl = page.url();
  const isRedirectedToLogin =
currentUrl.includes('/auth/login') || currentUrl.includes('/login');

  const bodyText = await page.locator('body').textContent();
  const hasAuthError =
bodyText?.toLowerCase().includes('login') ||
bodyText?.toLowerCase().includes('authentication') ||
bodyText?.toLowerCase().includes('sign in') ||
bodyText?.toLowerCase().includes('unauthorized');

  expect(isRedirectedToLogin || hasAuthError).toBeTruthy();
  console.log('✅ Authentication protection verified');
});
  });
});
