// Dashboard Layout and Navigation Test

import {
  getOrCreateTestUser,
  ensureLoggedOut,
  type TestUser,
} from '@/utils/auth-helpers';
import { expect, test } from '@playwright/test';

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
  const user = await getOrCreateTestUser(page);
  console.log(`✅ Using authenticated test user: ${user.email}`);
});

test('should discover and verify all expected dashboard tabs', async ({
  page,
  browserName,
}) => {
  test.slow(
browserName === 'webkit',
'WebKit needs more time for authentication',
  );
  await page.goto('/dashboard');
  await page.waitForFunction(
() => !document.body.textContent?.includes('Checking authentication'),
{ timeout: 30000 },
  );
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

  const tabElements = await page.locator('[data-testid^="tab-"]').all();
  expect(tabElements.length).toBeGreaterThan(0);
  const discoveredTabs: string[] = [];
  for (const tab of tabElements) {
const testId = await tab.getAttribute('data-testid');
if (testId) {
  const tabName = testId.replace('tab-', '');
  discoveredTabs.push(tabName);
}
  }

  console.log(`🔍 Discovered tabs: ${discoveredTabs.join(', ')}`);

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
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  await page.waitForSelector('[data-testid^="tab-"]', { timeout: 30000 });
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
},
  ];

  for (const { tab, expectedUrl, contentCheck } of tabTests) {
console.log(`🖱️  Testing tab: ${tab}`);

await page.click(`[data-testid="tab-${tab}"]`);

await expect(page).toHaveURL(expectedUrl, { timeout: 5000 });
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

await page.waitForFunction(() => document.body.innerText.length > 100, {
  timeout: 30000,
});

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
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

  await page.goto('/dashboard/nonexistent');
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

  if (!isValidRedirect) {
await page.goto('/dashboard');
await expect(page).toHaveURL('/dashboard');
  }
  await page.waitForSelector('[data-testid="tab-dashboard"]', {
timeout: 5000,
  });
  await page.click('[data-testid="tab-dashboard"]');
  await expect(page).toHaveURL('/dashboard');

  console.log('✅ Edge cases and invalid routes handled gracefully');
});
  });

  test.describe('Password Change', () => {
test('should change password and verify authentication with new password', async ({
  page,
}) => {
  console.log('🔐 Testing complete password change flow...');

  const testUser = await getOrCreateTestUser(page);
  const userEmail = testUser.email;
  await page.goto('/dashboard/settings');
  await expect(page).toHaveURL('/dashboard/settings', { timeout: 15000 });

  await page.waitForSelector(
'input[placeholder="Enter your new password"]',
{ timeout: 10000 },
  );
  const newPassword = 'UpdatedPass123';
  await page.fill(
'input[placeholder="Enter your new password"]',
newPassword,
  );
  await page.fill(
'input[placeholder="Confirm your new password"]',
newPassword,
  );
  await page.click('button:has-text("Update Password")');

  await page.waitForSelector('.mantine-Notification-root', {
timeout: 10000,
  });
  console.log('✅ Password changed successfully');

  await ensureLoggedOut(page);
  console.log('✅ Logged out successfully');
  await page.goto('/auth/login');
  await page.waitForSelector('[data-testid="login-email-input"]', {
timeout: 10000,
  });

  await page.fill('[data-testid="login-email-input"]', userEmail);
  await page.fill('[data-testid="login-password-input"]', newPassword);
  await page.click('[data-testid="login-submit-button"]');

  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  await page.waitForSelector('[data-testid^="tab-"]', { timeout: 10000 });

  console.log(
'✅ Successfully logged in with new password and accessed dashboard',
  );
});
  });

  test.describe('Unauthenticated Access Tests', () => {
test('should prevent unauthenticated access', async ({ page }) => {
  await ensureLoggedOut(page);

  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
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
