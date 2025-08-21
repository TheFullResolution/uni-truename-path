/**
 * Dashboard Layout Test
 *
 * Tests the dashboard layout, navigation, and user interface components.
 * This test ensures all dashboard tabs are accessible and navigation works correctly.
 */

import {
  type DemoPersona,
  ensureLoggedOut,
  loginAsDemoUser,
} from '@/utils/auth-helpers';
import { expect, test } from '@playwright/test';

// Use JJ as our test persona
const TEST_PERSONA: DemoPersona = 'JJ';

test.describe('Dashboard Layout', () => {
  test.beforeEach(async ({ page }) => {
// Ensure clean state before each test
await ensureLoggedOut(page);
// Login for all dashboard tests
await loginAsDemoUser(page, TEST_PERSONA);
  });

  test.describe('Dashboard Navigation', () => {
test('should access all dashboard tabs', async ({ page }) => {
  const dashboardTabs = [
{ path: 'dashboard', name: 'Dashboard Home' },
{ path: 'dashboard/names', name: 'Names' },
{ path: 'dashboard/contexts', name: 'Contexts' },
{ path: 'dashboard/oidc-preview', name: 'OIDC Preview' },
{ path: 'dashboard/consents', name: 'Consents' },
{ path: 'dashboard/settings', name: 'Settings' },
  ];

  for (const tab of dashboardTabs) {
await page.goto(`/${tab.path}`);
await expect(page).toHaveURL(`/${tab.path}`);

// Verify page loads without errors
await expect(page.locator('body')).not.toHaveText(/error|failed/i);

// Verify page has some content (not completely empty)
await expect(page.locator('body')).not.toBeEmpty();

console.log(`✅ ${tab.name} tab accessible at /${tab.path}`);
  }

  console.log(`✅ All ${dashboardTabs.length} dashboard tabs accessible`);
});

test('should handle navigation between tabs', async ({ page }) => {
  // Test basic navigation flow
  await page.goto('/dashboard/names');
  await expect(page).toHaveURL('/dashboard/names');

  await page.goto('/dashboard/contexts');
  await expect(page).toHaveURL('/dashboard/contexts');

  await page.goto('/dashboard/assign');
  await expect(page).toHaveURL('/dashboard/assign');

  // Return to dashboard home
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard');

  console.log('✅ Dashboard navigation working correctly');
});

test('should maintain authentication across navigation', async ({
  page,
}) => {
  const testPages = [
'/dashboard',
'/dashboard/names',
'/dashboard/contexts',
  ];

  for (const pagePath of testPages) {
await page.goto(pagePath);

// Should not redirect to login
await expect(page).toHaveURL(pagePath);

// Should not show authentication error
await expect(page.locator('body')).not.toHaveText(
  /unauthorized|login required/i,
);
  }

  console.log('✅ Authentication maintained across all dashboard pages');
});
  });

  test.describe('Dashboard Layout Structure', () => {
test('should display proper dashboard layout', async ({ page }) => {
  await page.goto('/dashboard');

  // Wait for page to load completely
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  // Wait for dashboard content to be visible (Mantine components)
  await page.waitForSelector(
'div[style*="minHeight"], div[style*="linear-gradient"], [data-testid="dashboard-content"]',
{
  timeout: 10000,
},
  );

  // Verify dashboard has main content area (checking for actual structure)
  const hasMainContent =
(await page
  .locator(
'div[style*="minHeight"], div[style*="linear-gradient"], [data-testid="dashboard-content"]',
  )
  .count()) > 0;
  expect(hasMainContent).toBeTruthy();

  // Additional verification: check for container with paper elements
  const hasContainer =
(await page.locator('div:has(> div > div[class*="Paper"])').count()) >
0;

  // Should have either main content structure or container with papers
  expect(hasMainContent || hasContainer).toBeTruthy();

  console.log('✅ Dashboard layout structure verified');
});

test('should handle responsive navigation', async ({ page }) => {
  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/dashboard');

  // Page should still be accessible on mobile
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('body')).not.toHaveText(/error|failed/i);

  // Test desktop viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/dashboard/names');

  await expect(page).toHaveURL('/dashboard/names');
  await expect(page.locator('body')).not.toHaveText(/error|failed/i);

  console.log('✅ Responsive navigation working correctly');
});
  });

  test.describe('Dashboard Error Handling', () => {
test('should handle invalid dashboard routes gracefully', async ({
  page,
}) => {
  // Test invalid dashboard subroute
  await page.goto('/dashboard/nonexistent');

  // Should either redirect to valid page or show proper 404
  const currentUrl = page.url();
  const isValidRedirect =
currentUrl.includes('/dashboard') &&
!currentUrl.includes('/nonexistent');
  const is404Page = await page
.locator('body')
.textContent()
.then(
  (text) =>
text?.toLowerCase().includes('not found') ||
text?.toLowerCase().includes('404'),
);

  expect(isValidRedirect || is404Page).toBeTruthy();

  console.log('✅ Invalid dashboard routes handled gracefully');
});

test('should prevent direct access to dashboard when not authenticated', async ({
  page,
}) => {
  // Ensure completely logged out state
  await ensureLoggedOut(page);

  // Small delay for webkit browser stability
  if (page.context().browser()?.browserType().name() === 'webkit') {
await page.waitForTimeout(500);
  }

  // Try to access dashboard
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');

  // Wait a moment for any redirects to complete
  await page.waitForTimeout(2000);

  // Check if redirected to login or has authentication error
  const currentUrl = page.url();
  const isRedirectedToLogin =
currentUrl.includes('/auth/login') || currentUrl.includes('/login');

  const bodyText = await page.locator('body').textContent();
  const hasAuthError =
bodyText?.toLowerCase().includes('login') ||
bodyText?.toLowerCase().includes('authentication') ||
bodyText?.toLowerCase().includes('sign in') ||
bodyText?.toLowerCase().includes('unauthorized');

  // Debug output for troubleshooting
  if (!isRedirectedToLogin && !hasAuthError) {
console.log(`🐛 Debug - Current URL: ${currentUrl}`);
console.log(
  `🐛 Debug - Body contains: ${bodyText?.substring(0, 200)}...`,
);
  }

  expect(isRedirectedToLogin || hasAuthError).toBeTruthy();

  console.log('✅ Authentication protection working correctly');
});
  });
});
