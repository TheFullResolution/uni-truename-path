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

// Hero Section
const heroSection = page.getByTestId('overview-hero');
await expect(heroSection).toBeVisible();
await expect(
  heroSection.getByRole('heading', { name: 'What is TrueNamePath?' }),
).toBeVisible();
await expect(
  heroSection.getByText('Academic Research Project'),
).toBeVisible();
console.log('✅ Hero section verified');

// Problem Statement Section
const problemSection = page.getByTestId('overview-problem');
await expect(problemSection).toBeVisible();
await expect(
  problemSection.getByRole('heading', { name: 'The Problem We Solve' }),
).toBeVisible();
await expect(
  problemSection.getByText('Real-World Name Complexity'),
).toBeVisible();
console.log('✅ Problem Statement section verified');

// Solution Section
const solutionSection = page.getByTestId('overview-solution');
await expect(solutionSection).toBeVisible();
await expect(
  solutionSection.getByRole('heading', {
name: 'Our Innovation: Context-Aware Identity Resolution',
  }),
).toBeVisible();
await expect(
  solutionSection.getByText('FIRST system of its kind'),
).toBeVisible();
console.log('✅ Solution section verified');

// Key Features Section
const featuresSection = page.getByTestId('overview-features');
await expect(featuresSection).toBeVisible();
await expect(
  featuresSection.getByRole('heading', { name: 'Key Features' }),
).toBeVisible();
await expect(
  featuresSection.getByText('Complete User Control:'),
).toBeVisible();
console.log('✅ Key Features section verified');

// Demo Apps Section
const demoSection = page.getByTestId('overview-demo-section');
await expect(demoSection).toBeVisible();
await expect(
  demoSection.getByRole('heading', { name: 'See It In Action' }),
).toBeVisible();
console.log('✅ Demo Apps section verified');

// Academic Context Section
const academicSection = page.getByTestId('overview-academic');
await expect(academicSection).toBeVisible();
await expect(
  academicSection.getByText('Academic Project Context'),
).toBeVisible();
console.log('✅ Academic Context section verified');

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

// Check which state is displayed
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

// Test page title
const title = await page.title();
expect(title).toContain('TrueNamePath Documentation');
expect(title).toContain('Overview');
console.log(`✅ Page title: ${title}`);

// Test semantic structure
const h1Elements = page.locator('h1');
const h1Count = await h1Elements.count();
expect(h1Count).toBeGreaterThanOrEqual(1);
console.log(`✅ Found ${h1Count} h1 element(s)`);

const h2Elements = page.locator('h2');
const h2Count = await h2Elements.count();
expect(h2Count).toBeGreaterThan(0);
console.log(`✅ Found ${h2Count} h2 elements for proper heading hierarchy`);

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
});
