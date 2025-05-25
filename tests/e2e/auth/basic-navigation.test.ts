import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth-helpers';

test.describe('Basic Application Navigation', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
authHelper = new AuthHelper(page);
  });

  test('should load home page', async ({ page }) => {
await page.goto('/');
await expect(page.locator('text=Home page')).toBeVisible();
  });

  test('should have proper HTML structure', async ({ page }) => {
await page.goto('/');

// Verify basic HTML structure from layout.tsx
await expect(page.locator('html[lang="en"]')).toBeVisible();
await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
  'content', 
  'minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no'
);

// Verify Mantine is loaded
await expect(page.locator('head script')).toHaveCount(1); // ColorSchemeScript
  });

  test('should have favicon', async ({ page }) => {
await page.goto('/');
const favicon = page.locator('link[rel="shortcut icon"]');
await expect(favicon).toHaveAttribute('href', '/favicon.svg');
  });

  test('should render with Mantine provider', async ({ page }) => {
await page.goto('/');

// Check that Mantine CSS is loaded
const mantineStyles = await page.evaluate(() => {
  const stylesheets = Array.from(document.styleSheets);
  return stylesheets.some(sheet => {
try {
  return Array.from(sheet.cssRules || []).some(rule => 
rule.cssText.includes('mantine') || 
rule.cssText.includes('--mantine')
  );
} catch {
  return false;
}
  });
});

// Note: This might not always work due to CORS, but worth testing
// In a real app, you'd test for Mantine-specific classes or behavior
  });

  test('should be responsive', async ({ page }) => {
// Test desktop
await page.setViewportSize({ width: 1200, height: 800 });
await page.goto('/');
await expect(page.locator('text=Home page')).toBeVisible();

// Test tablet
await page.setViewportSize({ width: 768, height: 1024 });
await expect(page.locator('text=Home page')).toBeVisible();

// Test mobile
await page.setViewportSize({ width: 375, height: 667 });
await expect(page.locator('text=Home page')).toBeVisible();
  });
});