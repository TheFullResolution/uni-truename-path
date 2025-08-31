import { expect, test } from '@playwright/test';
import { getOrCreateTestUser, createTestContext } from '@/utils/auth-helpers';

test.describe('Default Context Constraints', () => {
  test.beforeEach(async ({ page }) => {
// Use getOrCreateTestUser for UI mode compatibility
const user = await getOrCreateTestUser(page);
console.log(`✅ Using authenticated test user: ${user.email}`);

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

  test('should auto-populate new contexts with default OIDC assignments', async ({
page,
  }) => {
// Navigate to contexts tab
await page.getByTestId('tab-contexts').click();
await page.waitForLoadState('networkidle');

// Find the "Test Work Context" created in beforeEach
const testContextCard = page
  .locator('[data-testid^="context-card"]')
  .filter({ hasText: 'Test Work Context' });

await expect(testContextCard).toBeVisible();

// Click edit assignments to verify auto-population
await testContextCard
  .locator('[data-testid="edit-assignments-button"]')
  .click();

// Wait for assignment modal with specific context name
await expect(
  page.getByText('Edit Assignments - Test Work Context'),
).toBeVisible();

// Verify basic OIDC properties have assignments (not "Not assigned")
const oidcProperties = ['Name', 'Given Name', 'Family Name'];

for (const property of oidcProperties) {
  // Use exact text matching to avoid matching substring properties
  const propertyCell = page
.locator('table')
.getByText(property, { exact: true });

  // Find the parent row and check it doesn't contain "Not assigned"
  const propertyRow = propertyCell.locator('xpath=ancestor::tr');

  // Check that property has an assignment (doesn't show "Not assigned")
  await expect(propertyRow).not.toContainText('Not assigned');
}

console.log(
  '✅ Context auto-population verified - OIDC properties populated',
);

// Close modal - target the Cancel button in the modal specifically
await page
  .getByLabel('Edit Assignments - Test Work')
  .getByRole('button', { name: 'Cancel' })
  .click();
  });
});
