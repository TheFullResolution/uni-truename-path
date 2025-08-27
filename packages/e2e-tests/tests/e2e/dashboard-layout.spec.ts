/**
 * Dashboard Layout and Navigation Test
 *
 * Efficient, unified test suite for dashboard tabs and navigation.
 * Uses single login/logout cycle and dynamic tab discovery for optimal performance.
 */

import {
  ensureLoggedOut,
  createAndLoginTestUser,
  type TestUser,
} from '@/utils/auth-helpers';
import { expect, test } from '@playwright/test';

// Expected dashboard tabs based on code analysis
const EXPECTED_TABS = [
  'dashboard',
  'contexts',
  'names',
  'consents',
  'settings',
];

test.describe('Dashboard Layout and Navigation', () => {
  test.beforeEach(async ({ page }) => {
// Ensure clean state and login for each test
await ensureLoggedOut(page);
await createAndLoginTestUser(page);
  });

  test('should discover and verify all expected dashboard tabs', async ({
page,
  }) => {
// Navigate to dashboard - should already be authenticated
await page.goto('/dashboard');
await page.waitForLoadState('networkidle');
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

  test('should navigate between tabs using UI interactions', async ({
page,
  }) => {
// Navigate to dashboard - should already be authenticated
await page.goto('/dashboard');
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
await page.waitForLoadState('networkidle');

// Test navigation to each tab by clicking UI elements
const tabNavigationTests = [
  { tab: 'contexts', expectedUrl: '/dashboard/contexts' },
  { tab: 'names', expectedUrl: '/dashboard/names' },
  { tab: 'consents', expectedUrl: '/dashboard/consents' },
  { tab: 'settings', expectedUrl: '/dashboard/settings' },
  { tab: 'dashboard', expectedUrl: '/dashboard' }, // Return to home
];

for (const { tab, expectedUrl } of tabNavigationTests) {
  console.log(`🖱️  Clicking tab: ${tab}`);

  // Click the tab
  await page.click(`[data-testid="tab-${tab}"]`);

  // Verify URL changed
  await expect(page).toHaveURL(expectedUrl, { timeout: 5000 });

  // Verify active tab state (tab should have active styling or aria-selected)
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
  console.log(`✅ Tab "${tab}" is active and URL is correct`);
}
  });

  test('should verify content area updates when switching tabs', async ({
page,
  }) => {
// Navigate to dashboard - should already be authenticated
await page.goto('/dashboard');
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
await page.waitForLoadState('networkidle');

// Test that content area updates when switching between tabs
const contentTestTabs = ['contexts', 'names', 'consents'];

for (const tab of contentTestTabs) {
  console.log(`📄 Testing content loading for tab: ${tab}`);

  // Click tab
  await page.click(`[data-testid="tab-${tab}"]`);
  await page.waitForLoadState('networkidle');

  // Verify page content loaded (no errors)
  await expect(page.locator('body')).not.toHaveText(/error|failed|404/i);

  // Verify content area is not empty
  await expect(page.locator('body')).not.toBeEmpty();

  // Verify specific content indicators based on tab
  if (tab === 'contexts') {
// Should have contexts-related content or empty state
const hasContextContent =
  (await page.locator('text=/context|Context/i').count()) > 0;
expect(hasContextContent).toBeTruthy();
  } else if (tab === 'names') {
// Should have names-related content or empty state
const hasNameContent =
  (await page.locator('text=/name|Name/i').count()) > 0;
expect(hasNameContent).toBeTruthy();
  } else if (tab === 'consents') {
// Should have consents-related content
const hasConsentContent =
  (await page.locator('text=/consent|Consent/i').count()) > 0;
expect(hasConsentContent).toBeTruthy();
  }

  console.log(`✅ Content verified for tab: ${tab}`);
}
  });

  test('should handle responsive behavior', async ({ page }) => {
// Navigate to dashboard - should already be authenticated
await page.goto('/dashboard');
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

// Test mobile viewport
await page.setViewportSize({ width: 375, height: 667 });
await page.waitForTimeout(500); // Allow layout to adjust

// Tabs should still be discoverable and clickable on mobile
const mobileTabCount = await page.locator('[data-testid^="tab-"]').count();
expect(mobileTabCount).toBeGreaterThan(0);

// Test tab interaction on mobile
await page.click('[data-testid="tab-contexts"]');
await expect(page).toHaveURL('/dashboard/contexts');

// Test desktop viewport
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(500); // Allow layout to adjust

// Tabs should still work on desktop
await page.click('[data-testid="tab-names"]');
await expect(page).toHaveURL('/dashboard/names');

console.log('✅ Responsive navigation verified across viewports');
  });

  test('should handle edge cases and invalid routes', async ({ page }) => {
// Navigate to dashboard - should already be authenticated
await page.goto('/dashboard');
await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

// Test invalid dashboard route
await page.goto('/dashboard/nonexistent');

// Should either redirect to valid page or show proper error handling
const currentUrl = page.url();
const isValidRedirect =
  currentUrl.includes('/dashboard') && !currentUrl.includes('/nonexistent');
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

  test('should prevent unauthenticated access', async ({ page }) => {
// Test unauthenticated access in a separate context
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
