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

// Hero Section
const heroSection = page.getByTestId('quick-start-hero');
await expect(heroSection).toBeVisible();
await expect(
  heroSection.getByRole('heading', {
name: 'Getting Started with TrueNamePath',
  }),
).toBeVisible();
await expect(
  heroSection.getByText('Follow these simple steps to set up your account'),
).toBeVisible();
console.log('✅ Hero section verified');

// Timeline Section with all 5 steps
const timelineSection = page.getByTestId('quick-start-timeline');
await expect(timelineSection).toBeVisible();

// Verify all 5 timeline steps are present - using timeline title selectors
await expect(
  timelineSection.locator(
'[class*="mantine-Timeline-itemTitle"]:has-text("Account Creation")',
  ),
).toBeVisible();
await expect(
  timelineSection.locator(
'[class*="mantine-Timeline-itemTitle"]:has-text("Default Context Setup")',
  ),
).toBeVisible();
await expect(
  timelineSection.locator(
'[class*="mantine-Timeline-itemTitle"]:has-text("Custom Contexts Creation")',
  ),
).toBeVisible();
await expect(
  timelineSection.locator(
'[class*="mantine-Timeline-itemTitle"]:has-text("App Connection")',
  ),
).toBeVisible();
await expect(
  timelineSection.locator(
'[class*="mantine-Timeline-itemTitle"]:has-text("Understanding the Rules")',
  ),
).toBeVisible();
console.log('✅ Timeline with 5 steps verified');

// OIDC Properties Table
const propertiesTable = page.getByTestId('oidc-properties-table');
await expect(propertiesTable).toBeVisible();
await expect(propertiesTable.getByText('Property')).toBeVisible();
await expect(propertiesTable.getByText('Example Assignment')).toBeVisible();
console.log('✅ OIDC properties table verified');

// Context Examples Alert
const contextAlert = page.getByTestId('context-examples-alert');
await expect(contextAlert).toBeVisible();
await expect(
  contextAlert.getByText('Common Context Examples'),
).toBeVisible();
await expect(contextAlert.getByText('Work Colleagues')).toBeVisible();
console.log('✅ Context examples alert verified');

// App Response Code Block
const codeBlock = page.getByTestId('app-response-code');
await expect(codeBlock).toBeVisible();
await expect(codeBlock.getByText('"name": "John Smith"')).toBeVisible();
console.log('✅ App response code block verified');

// Call to Action
const ctaSection = page.getByTestId('quick-start-cta');
await expect(ctaSection).toBeVisible();
await expect(ctaSection.getByText('Ready to get started?')).toBeVisible();
console.log('✅ Call to action section verified');

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

// Test key content from each step

// Step 1: Account Creation
await expect(timelineSection.getByText('Basic Registration')).toBeVisible();
await expect(timelineSection.getByText('Profile Completion')).toBeVisible();
console.log('✅ Step 1 content verified');

// Step 2: Default Context Setup
await expect(timelineSection.getByText('Add Your Names')).toBeVisible();
await expect(
  timelineSection.getByText('Assign to OIDC Properties'),
).toBeVisible();
console.log('✅ Step 2 content verified');

// Step 3: Custom Contexts Creation
await expect(
  timelineSection.getByText('Create New Contexts'),
).toBeVisible();
await expect(timelineSection.getByText('Set Visibility')).toBeVisible();
console.log('✅ Step 3 content verified');

// Step 4: App Connection
await expect(timelineSection.getByText('Authorize Apps')).toBeVisible();
await expect(timelineSection.getByText('Assign Contexts')).toBeVisible();
console.log('✅ Step 4 content verified');

// Step 5: Understanding the Rules
await expect(timelineSection.getByText('Protected Names')).toBeVisible();
await expect(timelineSection.getByText('Safe Changes')).toBeVisible();
console.log('✅ Step 5 content verified');

console.log('✅ Timeline structure and content verified successfully');
  });

  test('should be accessible and responsive', async ({ page }) => {
console.log('🔍 Testing accessibility and responsive behavior...');

// Test page title
const title = await page.title();
expect(title).toContain('Quick Start');
expect(title).toContain('TrueNamePath User Guide');
console.log(`✅ Page title: ${title}`);

// Test semantic structure
const h1Elements = page.locator('h1');
const h1Count = await h1Elements.count();
expect(h1Count).toBe(1);
await expect(h1Elements.first()).toHaveText(
  'Getting Started with TrueNamePath',
);
console.log(`✅ Found ${h1Count} h1 element with correct text`);

// Verify timeline titles structure
const timelineTitles = page.locator(
  '[class*="mantine-Timeline-itemTitle"]',
);
const titleCount = await timelineTitles.count();
expect(titleCount).toBe(5);
console.log(`✅ Found ${titleCount} timeline titles`);

// Test table accessibility
const propertiesTable = page.getByTestId('oidc-properties-table');
const tableHeaders = propertiesTable.locator('th');
const headerCount = await tableHeaders.count();
expect(headerCount).toBe(2);
await expect(propertiesTable.getByText('Property')).toBeVisible();
await expect(propertiesTable.getByText('Example Assignment')).toBeVisible();
console.log(`✅ Table has ${headerCount} headers`);

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

// Verify meta description
const metaDescription = await page
  .locator('meta[name="description"]')
  .getAttribute('content');
expect(metaDescription).toBeTruthy();
expect(metaDescription).toContain('Step-by-step guide');
console.log(`✅ Meta description verified`);

console.log('✅ Accessibility and responsive behavior verified');
  });
});
