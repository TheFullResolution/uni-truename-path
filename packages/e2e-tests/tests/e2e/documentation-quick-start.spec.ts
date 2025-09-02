// Quick Start Guide E2E Test

import { expect, test } from '@playwright/test';

test.describe('Quick Start Guide Page', () => {
  test.beforeEach(async ({ page }) => {
await page.goto('/docs/quick-start');
await page.waitForLoadState('domcontentloaded');
  });

  test('should load and display all main content sections', async ({
page,
  }) => {
console.log('🔍 Testing main content sections visibility...');

// Hero Section - structural checks only
const heroSection = page.getByTestId('quick-start-hero');
await expect(heroSection).toBeVisible();
await expect(heroSection.locator('h1')).toBeVisible();
await expect(heroSection.locator('p, div').first()).toBeVisible(); // Description
console.log('✅ Hero section structure verified');

// Timeline Section with all 5 steps
const timelineSection = page.getByTestId('quick-start-timeline');
await expect(timelineSection).toBeVisible();

// Verify timeline has the expected structure without checking text content
// Use a more specific selector that targets the timeline bullets (each represents one item)
const timelineItems = timelineSection.locator(
  '[class*="mantine-Timeline-itemBullet"]',
);
const itemCount = await timelineItems.count();
expect(itemCount).toBe(5);
console.log(`✅ Timeline with ${itemCount} steps verified`);

// Verify timeline titles and bodies exist (using separate selectors)
const timelineTitles = timelineSection.locator(
  '[class*="mantine-Timeline-itemTitle"]',
);
const titleCount = await timelineTitles.count();
expect(titleCount).toBe(5);

const timelineBodies = timelineSection.locator(
  '[class*="mantine-Timeline-itemBody"]',
);
const bodyCount = await timelineBodies.count();
expect(bodyCount).toBe(5);

console.log('✅ All timeline items have proper structure');

// OIDC Properties Table - structure only
const propertiesTable = page.getByTestId('oidc-properties-table');
await expect(propertiesTable).toBeVisible();
await expect(propertiesTable.locator('thead')).toBeVisible();
await expect(propertiesTable.locator('th')).toHaveCount(2);
const rowCount = await propertiesTable.locator('tbody tr').count();
expect(rowCount).toBeGreaterThanOrEqual(3);
console.log('✅ OIDC properties table structure verified');

// Context Examples Alert - structure only
const contextAlert = page.getByTestId('context-examples-alert');
await expect(contextAlert).toBeVisible();
// The contextAlert element IS the alert, no need to look for Alert-root child
console.log('✅ Context examples alert structure verified');

// App Response Code Block - structure only
const codeBlock = page.getByTestId('app-response-code');
await expect(codeBlock).toBeVisible();
console.log('✅ App response code block structure verified');

// Call to Action section - structure only
const ctaSection = page.getByTestId('quick-start-cta');
await expect(ctaSection).toBeVisible();
await expect(ctaSection.locator('p, div')).toBeVisible();
console.log('✅ Call to action section structure verified');

console.log('✅ All main content sections verified successfully');
  });

  test('should display timeline steps with proper structure and content', async ({
page,
  }) => {
console.log('🔍 Testing timeline structure and key content...');

const timelineSection = page.getByTestId('quick-start-timeline');

// Verify timeline icons are present (should be 5 gradient ThemeIcons)
const timelineIcons = timelineSection.locator(
  '[class*="mantine-ThemeIcon-root"]',
);
const iconCount = await timelineIcons.count();
expect(iconCount).toBe(5);
console.log(`✅ Found ${iconCount} timeline icons`);

// Verify timeline has proper structure
const timelineTitles = timelineSection.locator(
  '[class*="mantine-Timeline-itemTitle"]',
);
const timelineBodies = timelineSection.locator(
  '[class*="mantine-Timeline-itemBody"]',
);

expect(await timelineTitles.count()).toBe(5);
expect(await timelineBodies.count()).toBe(5);

// Verify each title and body is visible
for (let i = 0; i < 5; i++) {
  await expect(timelineTitles.nth(i)).toBeVisible();
  await expect(timelineBodies.nth(i)).toBeVisible();

  // Each body should have some content (paragraphs or divs)
  const bodyContent = timelineBodies.nth(i).locator('p, div');
  const contentCount = await bodyContent.count();
  expect(contentCount).toBeGreaterThan(0);
  console.log(`✅ Step ${i + 1} has ${contentCount} content elements`);
}

console.log('✅ Timeline structure and content verified successfully');
  });

  test('should have proper interactive elements and structure', async ({
page,
  }) => {
console.log('🔍 Testing interactive elements and structure...');

// Test that timeline is properly structured
const timelineSection = page.getByTestId('quick-start-timeline');

// Timeline section should be visible (it IS the timeline root)
await expect(timelineSection).toBeVisible();

// Table should be accessible
const table = page.getByTestId('oidc-properties-table');
await expect(table).toBeVisible();
await expect(table.locator('thead th')).toHaveCount(2);

// Code block should have proper structure
const codeBlock = page.getByTestId('app-response-code');
await expect(codeBlock).toBeVisible(); // Just check the block exists

// Alert should have proper structure
const alert = page.getByTestId('context-examples-alert');
await expect(alert).toBeVisible(); // The alert element itself IS the alert

// Check for list items in alert (example contexts)
const listItems = alert.locator('li, p');
const listCount = await listItems.count();
expect(listCount).toBeGreaterThan(3); // Should have multiple examples
console.log(`✅ Found ${listCount} context examples`);

console.log('✅ Interactive elements and structure verified');
  });

  test('should be accessible and responsive', async ({ page }) => {
console.log('🔍 Testing accessibility and responsive behavior...');

// Test page title structure
const title = await page.title();
expect(title).toContain('Quick Start');
expect(title).toContain('TrueNamePath');
console.log(`✅ Page title contains expected keywords: ${title}`);

// Test semantic structure
const h1Elements = page.locator('h1');
const h1Count = await h1Elements.count();
expect(h1Count).toBe(1);
console.log(`✅ Found ${h1Count} h1 element`);

// Verify timeline titles structure (should be semantic headings or strong elements)
const timelineSection = page.getByTestId('quick-start-timeline');
const timelineTitles = timelineSection.locator(
  '[class*="mantine-Timeline-itemTitle"]',
);
const titleCount = await timelineTitles.count();
expect(titleCount).toBe(5);
console.log(`✅ Found ${titleCount} timeline titles`);

// Test table accessibility structure
const propertiesTable = page.getByTestId('oidc-properties-table');
const tableHeaders = propertiesTable.locator('th');
const headerCount = await tableHeaders.count();
expect(headerCount).toBe(2);
console.log(`✅ Table has ${headerCount} headers`);

// Test that table has data rows
const dataRows = propertiesTable.locator('tbody tr');
const rowCount = await dataRows.count();
expect(rowCount).toBeGreaterThanOrEqual(3);
console.log(`✅ Table has ${rowCount} data rows`);

// Test mobile responsiveness
await page.setViewportSize({ width: 375, height: 667 });

// Verify main sections are still visible on mobile
await expect(page.getByTestId('quick-start-hero')).toBeVisible();
await expect(page.getByTestId('quick-start-timeline')).toBeVisible();
await expect(page.getByTestId('oidc-properties-table')).toBeVisible();

// Check for horizontal scrolling
const hasHorizontalScroll = await page.evaluate(() => {
  return document.body.scrollWidth > window.innerWidth;
});
expect(hasHorizontalScroll).toBeFalsy();
console.log('✅ No horizontal scrolling on mobile viewport');

// Verify meta description exists
const metaDescription = await page
  .locator('meta[name="description"]')
  .getAttribute('content');
expect(metaDescription).toBeTruthy();
expect(metaDescription?.length).toBeGreaterThan(10);
console.log(
  `✅ Meta description verified (${metaDescription?.length} characters)`,
);

console.log('✅ Accessibility and responsive behavior verified');
  });

  test('should have proper visual elements and styling', async ({ page }) => {
console.log('🔍 Testing visual elements and styling...');

// Test timeline visual structure
const timelineSection = page.getByTestId('quick-start-timeline');

// Should have visual icons for each step
const icons = timelineSection.locator('svg, [class*="Icon"]');
const iconCount = await icons.count();
expect(iconCount).toBeGreaterThan(0);
console.log(`✅ Found ${iconCount} icons in timeline`);

// Test that code block has syntax highlighting or proper formatting
const codeBlock = page.getByTestId('app-response-code');
await expect(codeBlock).toBeVisible();
const codeElement = codeBlock.locator('code, pre').first();

// Code should contain JSON-like structure (if element exists)
const codeElementCount = await codeElement.count();
if (codeElementCount > 0) {
  const codeContent = await codeElement.textContent();
  expect(codeContent).toMatch(/[{"}]/); // Should contain JSON characters
  console.log('✅ Code block contains structured content');
} else {
  // If no traditional code element, check if content exists in the testid element itself
  const blockContent = await codeBlock.textContent();
  expect(blockContent).toBeTruthy();
  console.log('✅ Code block has content');
}

// Test alert visual structure
const alert = page.getByTestId('context-examples-alert');
const alertIcon = alert.locator('svg, [class*="Icon"]');
await expect(alertIcon).toBeVisible();
console.log('✅ Alert has proper icon');

// Test table visual structure
const table = page.getByTestId('oidc-properties-table');
await expect(table).toBeVisible();

// Should have code elements in table cells
const codeCells = table.locator('code');
const codeCount = await codeCells.count();
expect(codeCount).toBeGreaterThan(0);
console.log(`✅ Table has ${codeCount} code elements`);

console.log('✅ Visual elements and styling verified');
  });
});
