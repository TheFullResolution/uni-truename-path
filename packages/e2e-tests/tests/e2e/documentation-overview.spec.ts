// Documentation Overview Page E2E Test

import { expect, test } from '@playwright/test';

test.describe('Documentation Overview Page', () => {
  test.beforeEach(async ({ page }) => {
await page.goto('/docs/overview');
await page.waitForLoadState('domcontentloaded');
  });

  test('should load and display all main content sections', async ({
page,
  }) => {
console.log('🔍 Testing main content sections visibility...');

// Hero Section - structural checks only
const heroSection = page.getByTestId('overview-hero');
await expect(heroSection).toBeVisible();
await expect(heroSection.locator('h1')).toBeVisible();
await expect(heroSection.locator('[class*="Badge-root"]')).toBeVisible();
await expect(heroSection.locator('p, div').first()).toBeVisible(); // Description text
console.log('✅ Hero section structure verified');

// Problem Statement Section
const problemSection = page.getByTestId('overview-problem');
await expect(problemSection).toBeVisible();
await expect(problemSection.locator('h2')).toBeVisible();
await expect(problemSection.locator('[class*="Alert-root"]')).toBeVisible(); // Research alert
console.log('✅ Problem Statement section structure verified');

// Solution Section
const solutionSection = page.getByTestId('overview-solution');
await expect(solutionSection).toBeVisible();
await expect(solutionSection.locator('h2')).toBeVisible();
const contentCount = await solutionSection.locator('p, div').count();
expect(contentCount).toBeGreaterThan(0); // Has content
console.log('✅ Solution section structure verified');

// Key Features Section
const featuresSection = page.getByTestId('overview-features');
await expect(featuresSection).toBeVisible();
await expect(featuresSection.locator('h2')).toBeVisible();
await expect(featuresSection.locator('[class*="List-root"]')).toBeVisible();
const featureCount = await featuresSection
  .locator('[class*="List-item"]')
  .count();
expect(featureCount).toBeGreaterThan(2); // Has multiple features
console.log('✅ Key Features section structure verified');

// Demo Apps Section
const demoSection = page.getByTestId('overview-demo-section');
await expect(demoSection).toBeVisible();
await expect(demoSection.locator('h2').first()).toBeVisible();
console.log('✅ Demo Apps section structure verified');

// Academic Context Section
const academicSection = page.getByTestId('overview-academic');
await expect(academicSection).toBeVisible();
await expect(
  academicSection.locator('[class*="Card"], [class*="Paper"]'),
).toBeVisible();
console.log('✅ Academic Context section structure verified');

console.log('✅ All main content sections verified successfully');
  });

  test('should handle demo apps showcase states correctly', async ({
page,
  }) => {
console.log('🔍 Testing demo apps showcase...');

await page.waitForTimeout(2000); // Allow time for demo apps to load

// Check if demo apps showcase is present in the demo section
const demoSection = page.getByTestId('overview-demo-section');

// Wait for one of the showcase states to be visible
const showcaseLocator = demoSection
  .locator('[data-testid*="demo-apps-showcase"]')
  .first();
await expect(showcaseLocator).toBeVisible({ timeout: 10000 });

// Check which state is displayed - we don't care about content, just that one state exists
const isShowcase = await demoSection
  .locator('[data-testid="demo-apps-showcase"]')
  .isVisible();
const isLoading = await demoSection
  .locator('[data-testid="demo-apps-showcase-loading"]')
  .isVisible();
const isError = await demoSection
  .locator('[data-testid="demo-apps-showcase-error"]')
  .isVisible();
const isEmpty = await demoSection
  .locator('[data-testid="demo-apps-showcase-empty"]')
  .isVisible();

if (isShowcase) {
  console.log('📊 Demo apps showcase is fully loaded');
  await expect(
demoSection.locator('[data-testid="demo-apps-showcase"]'),
  ).toBeVisible();
} else if (isLoading) {
  console.log('⏳ Demo apps showcase is in loading state');
  await expect(
demoSection.locator('[data-testid="demo-apps-showcase-loading"]'),
  ).toBeVisible();
} else if (isError) {
  console.log('❌ Demo apps showcase shows error state');
  await expect(
demoSection.locator('[data-testid="demo-apps-showcase-error"]'),
  ).toBeVisible();
} else if (isEmpty) {
  console.log('📭 Demo apps showcase shows empty state');
  await expect(
demoSection.locator('[data-testid="demo-apps-showcase-empty"]'),
  ).toBeVisible();
}

console.log('✅ Demo apps showcase verification completed');
  });

  test('should be accessible and responsive', async ({ page }) => {
console.log('🔍 Testing accessibility and responsive behavior...');

// Test page title structure (contains relevant keywords)
const title = await page.title();
expect(title).toContain('TrueNamePath Documentation');
expect(title).toContain('Overview');
console.log(`✅ Page title contains expected keywords: ${title}`);

// Test semantic structure
const h1Elements = page.locator('h1');
const h1Count = await h1Elements.count();
expect(h1Count).toBeGreaterThanOrEqual(1);
console.log(`✅ Found ${h1Count} h1 element(s)`);

const h2Elements = page.locator('h2');
const h2Count = await h2Elements.count();
expect(h2Count).toBeGreaterThan(0);
console.log(`✅ Found ${h2Count} h2 elements for proper heading hierarchy`);

// Test that main sections have content
const mainSections = [
  'overview-hero',
  'overview-problem',
  'overview-solution',
  'overview-features',
  'overview-demo-section',
  'overview-academic',
];

for (const sectionId of mainSections) {
  const section = page.getByTestId(sectionId);
  await expect(section).toBeVisible();
  const hasContent = await section.locator('p, div, li').count();
  expect(hasContent).toBeGreaterThan(0);
}
console.log('✅ All sections have content');

// Test mobile responsiveness
await page.setViewportSize({ width: 375, height: 667 });

// Verify main sections are still visible on mobile
await expect(page.getByTestId('overview-hero')).toBeVisible();
await expect(page.getByTestId('overview-problem')).toBeVisible();
await expect(page.getByTestId('overview-features')).toBeVisible();

// Check for horizontal scrolling
const hasHorizontalScroll = await page.evaluate(() => {
  return document.body.scrollWidth > window.innerWidth;
});
expect(hasHorizontalScroll).toBeFalsy();
console.log('✅ No horizontal scrolling on mobile viewport');

console.log('✅ Accessibility and responsive behavior verified');
  });

  test('should have proper document structure and navigation', async ({
page,
  }) => {
console.log('🔍 Testing document structure and navigation...');

// Check that page has proper document structure
await expect(page.locator('main, article, [role="main"]')).toBeVisible();

// Verify dividers exist between sections (structural separators)
const dividers = page.locator('[class*="Divider"], hr');
const dividerCount = await dividers.count();
expect(dividerCount).toBeGreaterThan(0);
console.log(`✅ Found ${dividerCount} section dividers`);

// Test that icons are present in features (visual indicators)
const featuresSection = page.getByTestId('overview-features');
const featureIcons = featuresSection.locator('[class*="ThemeIcon"], svg');
const iconCount = await featureIcons.count();
expect(iconCount).toBeGreaterThan(0);
console.log(`✅ Found ${iconCount} feature icons`);

// Verify alert components exist (important information)
const alerts = page.locator('[class*="Alert-root"]');
const alertCount = await alerts.count();
expect(alertCount).toBeGreaterThan(0);
console.log(`✅ Found ${alertCount} alert components`);

console.log('✅ Document structure and navigation verified');
  });
});
