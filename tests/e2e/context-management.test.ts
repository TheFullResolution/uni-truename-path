// TrueNamePath: Context Management E2E Tests - Performance Optimized
// Focused on essential context CRUD operations and validation
// Date: August 14, 2025
// Academic project - streamlined testing suite with shared user optimization

import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../utils/db-helpers';
import { AuthTestHelper } from '../utils/auth-helpers';
import {
  SharedTestSetup,
  OptimizedTestPattern,
  TEST_SUITE_CONFIGS,
} from '../utils/shared-test-setup';

/**
 * Context Management E2E Tests - Performance Optimized Version
 *
 * Essential tests for context management functionality:
 * - Context creation (success and duplicate handling)
 * - Context editing and updates
 * - Context deletion with confirmation
 * - Form validation for required fields
 * - Context list display with statistics
 * - Error handling for API failures
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Shared user across all tests (created once in beforeAll)
 * - Session injection instead of browser login
 * - Context-only cleanup between tests (no user deletion)
 * - Eliminated redundant beforeEach cleanup
 */

// Initialize optimized test pattern
const testPattern = new OptimizedTestPattern(
  TEST_SUITE_CONFIGS.CONTEXT_MANAGEMENT,
);

test.describe('Context Management - Essential Tests', () => {
  test.beforeAll(async () => {
await testPattern.setupSuite();
  });

  test.afterAll(async () => {
await testPattern.teardownSuite();
  });

  test.beforeEach(async ({}, testInfo) => {
await testPattern.setupTest(testInfo.title);
  });

  test.afterEach(async ({}, testInfo) => {
await testPattern.teardownTest(testInfo.title);
  });

  test.describe('Context Creation', () => {
test('should create a new context successfully', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);

  // Use shared user with optimized authentication
  await testPattern.authenticateWithSharedUser(page, '/contexts');

  // Check initial empty state
  await expect(page.getByText('No contexts created yet')).toBeVisible();
  await expect(
page.getByText('Create your first context to start organizing'),
  ).toBeVisible();

  // Fill in context creation form
  const contextName = `Work Team ${uniqueId}`;
  const description = 'Professional colleagues and managers';

  await page
.getByPlaceholder(
  "e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'",
)
.fill(contextName);
  await page
.getByPlaceholder('Brief description of when to use this context')
.fill(description);

  // Submit form
  await page.getByRole('button', { name: 'Create Context' }).click();

  // Check for success notification
  await expect(
page.getByText(`Successfully created context "${contextName}"`),
  ).toBeVisible({ timeout: 10000 });

  // Check context appears in list (avoid notification duplicate by being more specific)
  await expect(
page.locator('[data-size="lg"]').getByText(contextName),
  ).toBeVisible();
  await expect(page.getByText(description)).toBeVisible();
  await expect(page.getByText('0 names assigned')).toBeVisible();

  // Check empty state is gone
  await expect(page.getByText('No contexts created yet')).not.toBeVisible();
});

test('should handle duplicate context name error', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);

  // Use shared user with optimized authentication
  await testPattern.authenticateWithSharedUser(page, '/contexts');

  const contextName = `Duplicate Context ${uniqueId}`;

  // Create first context
  await page
.getByPlaceholder(
  "e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'",
)
.fill(contextName);
  await page.getByRole('button', { name: 'Create Context' }).click();
  await expect(
page.getByText(`Successfully created context "${contextName}"`),
  ).toBeVisible({ timeout: 10000 });

  // Try to create duplicate
  await page
.getByPlaceholder(
  "e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'",
)
.fill(contextName);
  await page.getByRole('button', { name: 'Create Context' }).click();

  // Should show error notification (check for notification title or error message)
  await expect(
page
  .locator('.mantine-Notification-root')
  .filter({ hasText: 'Error' })
  .or(page.getByText('Context name already exists')),
  ).toBeVisible({
timeout: 10000,
  });
});
  });

  test.describe('Context Editing', () => {
test('should edit and update context successfully', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);

  // Use shared user with optimized authentication
  await testPattern.authenticateWithSharedUser(page, '/contexts');

  // Create a context first
  const originalName = `Original Context ${uniqueId}`;
  const originalDescription = 'Original description';

  await page
.getByPlaceholder(
  "e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'",
)
.fill(originalName);
  await page
.getByPlaceholder('Brief description of when to use this context')
.fill(originalDescription);
  await page.getByRole('button', { name: 'Create Context' }).click();
  await expect(
page.getByText(`Successfully created context "${originalName}"`),
  ).toBeVisible({ timeout: 10000 });

  // Click edit button (it's an ActionIcon with IconEdit, so use icon selector)
  await page.locator('[data-testid="edit-context-button"]').first().click();

  // Check modal opens
  await expect(page.getByText('Edit Context')).toBeVisible();
  await expect(
page.locator('input[value="' + originalName + '"]'),
  ).toBeVisible();
  await expect(page.locator('.mantine-Modal-body textarea')).toHaveValue(
originalDescription,
  );

  // Update context details
  const updatedName = `Updated Context ${uniqueId}`;
  const updatedDescription = 'Updated description with more details';

  await page
.locator('input[value="' + originalName + '"]')
.fill(updatedName);
  await page
.locator('.mantine-Modal-body textarea')
.fill(updatedDescription);

  // Submit update
  await page.getByRole('button', { name: 'Update Context' }).click();

  // Check success notification
  await expect(
page.getByText(`Successfully updated context "${updatedName}"`),
  ).toBeVisible({ timeout: 10000 });

  // Wait for modal to close completely before checking updated content
  await expect(page.getByText('Edit Context')).not.toBeVisible({
timeout: 5000,
  });

  // Check updated content appears in list (use specific selector to avoid notification)
  await expect(
page.locator('[data-size="lg"]').getByText(updatedName),
  ).toBeVisible();
  await expect(page.getByText(updatedDescription)).toBeVisible();
  await expect(
page.locator('[data-size="lg"]').getByText(originalName),
  ).not.toBeVisible();
});
  });

  test.describe('Context Deletion', () => {
test('should delete context with confirmation', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);

  // Use shared user with optimized authentication
  await testPattern.authenticateWithSharedUser(page, '/contexts');

  // Create a context first
  const contextName = `To Delete ${uniqueId}`;

  await page
.getByPlaceholder(
  "e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'",
)
.fill(contextName);
  await page.getByRole('button', { name: 'Create Context' }).click();
  await expect(
page.getByText(`Successfully created context "${contextName}"`),
  ).toBeVisible({ timeout: 10000 });

  // Click delete button (it's an ActionIcon with IconTrash)
  await page
.locator('[data-testid="delete-context-button"]')
.first()
.click();

  // Check delete modal opens
  await expect(
page.getByRole('heading', { name: 'Delete Context' }),
  ).toBeVisible();
  await expect(
page.getByText(
  `Are you sure you want to delete the context "${contextName}"?`,
),
  ).toBeVisible();

  // Confirm deletion (use more specific selector in modal)
  await page
.locator('.mantine-Modal-body')
.getByRole('button', { name: 'Delete Context' })
.click();

  // Check success notification
  await expect(
page.getByText(`Successfully deleted context "${contextName}"`),
  ).toBeVisible({ timeout: 10000 });

  // Wait for modal to close completely before checking context removal
  await expect(
page.getByRole('heading', { name: 'Delete Context' }),
  ).not.toBeVisible({ timeout: 5000 });

  // Check context is removed from list (be more specific - exclude notifications)
  await expect(
page.locator('[data-size="lg"]').getByText(contextName),
  ).not.toBeVisible();
  await expect(page.getByText('No contexts created yet')).toBeVisible();
});
  });

  test.describe('Form Validation', () => {
test('should validate required context name field', async ({ page }) => {
  // Use shared user with optimized authentication
  await testPattern.authenticateWithSharedUser(page, '/contexts');

  // Submit empty form
  await page.getByRole('button', { name: 'Create Context' }).click();

  // Check validation error appears
  await expect(page.getByText('Context name is required')).toBeVisible();

  // Fill valid name and verify error clears
  await page
.getByPlaceholder(
  "e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'",
)
.fill('Valid Context Name');

  // Trigger form validation by trying to submit again (this clears the error)
  await page.getByRole('button', { name: 'Create Context' }).click();

  // Wait for success notification (context was created successfully)
  await expect(
page.getByText('Successfully created context "Valid Context Name"'),
  ).toBeVisible({ timeout: 10000 });
});
  });

  test.describe('Context Display', () => {
test('should display context list with statistics correctly', async ({
  page,
}) => {
  const uniqueId = Math.random().toString(36).substring(7);

  // Use shared user with optimized authentication
  await testPattern.authenticateWithSharedUser(page, '/contexts');

  // Create multiple contexts
  const contexts = [
{ name: `First Context ${uniqueId}`, desc: 'First description' },
{ name: `Second Context ${uniqueId}`, desc: 'Second description' },
  ];

  for (const context of contexts) {
await page
  .getByPlaceholder(
"e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'",
  )
  .fill(context.name);
await page
  .getByPlaceholder('Brief description of when to use this context')
  .fill(context.desc);
await page.getByRole('button', { name: 'Create Context' }).click();
await expect(
  page.getByText(`Successfully created context "${context.name}"`),
).toBeVisible({ timeout: 10000 });
  }

  // Check context count badge
  await expect(page.getByText('2 total')).toBeVisible();

  // Check each context displays expected data (use simpler approach)
  for (const context of contexts) {
await expect(
  page.locator('[data-size="lg"]').getByText(context.name),
).toBeVisible();
await expect(page.getByText(context.desc)).toBeVisible();
  }

  // Check badges and dates exist (expect multiple)
  await expect(page.getByText('0 names assigned').first()).toBeVisible();
  await expect(page.getByText('Created:').first()).toBeVisible();
});
  });

  test.describe('Error Handling', () => {
test('should handle API errors gracefully', async ({ page }) => {
  const uniqueId = Math.random().toString(36).substring(7);

  // Use shared user with optimized authentication
  await testPattern.authenticateWithSharedUser(page, '/contexts');

  // Mock API failure for context creation
  await page.route('**/api/contexts', (route) => {
if (route.request().method() === 'POST') {
  route.fulfill({
status: 500,
contentType: 'application/json',
body: JSON.stringify({
  success: false,
  message: 'Internal server error',
}),
  });
} else {
  route.continue();
}
  });

  // Try to create context
  await page
.getByPlaceholder(
  "e.g., 'HR Systems', 'Client Portal', 'Gaming Friends'",
)
.fill(`Error Test ${uniqueId}`);
  await page.getByRole('button', { name: 'Create Context' }).click();

  // Should show error notification
  await expect(
page
  .locator('.mantine-Notification-title')
  .filter({ hasText: 'Error Creating Context' })
  .first(),
  ).toBeVisible({
timeout: 10000,
  });

  // Test network error for context loading
  await page.route('**/api/contexts', (route) => {
if (route.request().method() === 'GET') {
  route.abort('failed');
} else {
  route.continue();
}
  });

  // Reload page to trigger context loading
  await page.reload();

  // Should show error notification (be more specific to avoid duplicates)
  await expect(
page
  .locator('.mantine-Notification-title')
  .filter({ hasText: 'Error Loading Contexts' })
  .first(),
  ).toBeVisible({
timeout: 10000,
  });
});
  });
});
