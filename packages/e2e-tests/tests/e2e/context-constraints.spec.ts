import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginAsDemoUser } from '@/utils/auth-helpers';
import {
  debugTestState,
  debugContextsAvailability,
  debugDatabaseFromTest,
  setupConsoleCapture,
} from '@/utils/debug-helpers';

test.describe('Default Context Constraints', () => {
  test.beforeEach(async ({ page }) => {
// Setup console capture for debugging
setupConsoleCapture(page);

await ensureLoggedOut(page);
await loginAsDemoUser(page, 'JJ'); // Use existing demo user
  });

  test('should open assignment modal and show OIDC properties', async ({
page,
  }) => {
// Navigate to contexts tab
await page.getByTestId('tab-contexts').click();

// Wait for page to load
await page.waitForLoadState('networkidle');

// Debug contexts availability before proceeding
const contextsDebug = await debugContextsAvailability(page);

// If no contexts are found, run comprehensive debug
if (contextsDebug.contextCount === 0) {
  console.log('⚠️  No contexts found - running comprehensive debug...');

  // Debug database state
  await debugDatabaseFromTest('JJ');

  // Debug overall test state
  await debugTestState(
page,
'Context Constraints Test - No Contexts Found',
{
  persona: 'JJ',
  includeNetworkRequests: true,
  includeDatabaseState: true,
},
  );

  // Provide helpful error message
  throw new Error(
`No contexts available for testing. Expected at least 1 context with edit-assignments-button, but found ${contextsDebug.contextCount}. ` +
  `Context tab available: ${contextsDebug.hasContextsTab}. ` +
  `This suggests demo user setup failed or database triggers didn't execute properly. ` +
  `Check validation logs above for database state details.`,
  );
}

console.log(
  `✅ Found ${contextsDebug.contextCount} context(s), proceeding with test...`,
);

// Open assignment modal for any context
await page.getByTestId('edit-assignments-button').first().click();

// Wait for assignment modal to open
await page.waitForSelector('text=Edit Assignments', { timeout: 10000 });

// Verify modal opens with assignment table
await expect(page.locator('table')).toBeVisible();

// Check that we have all expected OIDC properties visible
await expect(page.locator('text=Given Name').first()).toBeVisible();
await expect(page.locator('text=Family Name').first()).toBeVisible();
await expect(page.locator('text=Name').first()).toBeVisible();
await expect(page.locator('text=Nickname').first()).toBeVisible();

// Verify assignment summary is shown
await expect(page.locator('text=Assignment Summary')).toBeVisible();

// Close the modal
await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
