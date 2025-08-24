import { expect, test } from '@playwright/test';
import {
  ensureLoggedOut,
  createAndLoginTestUser,
  createTestContext,
} from '@/utils/auth-helpers';

test.describe('Default Context Constraints', () => {
  test.beforeEach(async ({ page }) => {
await ensureLoggedOut(page);
await createAndLoginTestUser(page);

// Create a test context for the test to use
await createTestContext(page, 'Test Work Context');
  });

  test('should open assignment modal and show OIDC properties', async ({
page,
  }) => {
// Navigate to contexts tab
await page.getByTestId('tab-contexts').click();

// Wait for page to load
await page.waitForLoadState('networkidle');

// Wait for at least one edit assignments button to appear
// This ensures contexts have loaded and rendered properly
await page.waitForSelector('[data-testid="edit-assignments-button"]', {
  timeout: 10000,
  state: 'visible',
});

// Check if we have any contexts available
const contextCount = await page
  .getByTestId('edit-assignments-button')
  .count();
expect(contextCount).toBeGreaterThan(0);

console.log(`✅ Found ${contextCount} context(s), proceeding with test...`);

// Open assignment modal for the first context
await page.getByTestId('edit-assignments-button').first().click();

// Wait for assignment modal to open and be fully rendered
await page.waitForSelector('text=Edit Assignments', { timeout: 10000 });

// Wait for the table to be visible and populated
await page.waitForSelector('table tbody tr', { timeout: 10000 });

// Verify modal opens with assignment table
await expect(page.locator('table')).toBeVisible();

// Check that we have all expected OIDC properties visible
// Using more specific selectors to find the property labels in the table
await expect(
  page.locator('table').getByText('Given Name', { exact: true }),
).toBeVisible();
await expect(
  page.locator('table').getByText('Family Name', { exact: true }),
).toBeVisible();
await expect(
  page.locator('table').getByText('Name', { exact: true }),
).toBeVisible();
await expect(
  page.locator('table').getByText('Nickname', { exact: true }),
).toBeVisible();

// Verify assignment summary is shown
await expect(page.locator('text=Assignment Summary')).toBeVisible();

// Close the modal
await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
