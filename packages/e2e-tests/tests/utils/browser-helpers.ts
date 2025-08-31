/**
 * Browser-specific helper utilities for E2E tests
 * Addresses timing and compatibility issues across different browsers
 */

import { Page, expect } from '@playwright/test';

/**
 * Browser-aware wait for element visibility with retry logic
 * @param page - Playwright page instance
 * @param selector - Element selector or locator
 * @param browserName - Browser name (webkit, firefox, chromium)
 * @param options - Wait options
 */
export async function waitForElementWithBrowserSupport(
  page: Page,
  selector: string | ReturnType<Page['locator']>,
  browserName: string,
  options: {
timeout?: number;
retries?: number;
stabilityWait?: number;
  } = {},
) {
  const { timeout = 15000, retries = 1, stabilityWait = 0 } = options;

  const locator =
typeof selector === 'string' ? page.locator(selector) : selector;

  if (browserName === 'webkit') {
// WebKit-specific handling with retries
let attempts = 0;
const maxAttempts = retries + 1;

while (attempts < maxAttempts) {
  try {
await expect(locator).toBeVisible({ timeout: timeout / maxAttempts });
if (stabilityWait > 0) {
  await page.waitForTimeout(stabilityWait);
}
return;
  } catch (error) {
attempts++;
if (attempts === maxAttempts) {
  console.log(
`❌ WebKit: Element not visible after ${maxAttempts} attempts`,
  );
  throw error;
}
console.log(
  `⚠️ WebKit: Retry ${attempts}/${maxAttempts} for element visibility`,
);
await page.waitForTimeout(1000);
  }
}
  } else if (browserName === 'firefox') {
// Firefox-specific handling with longer timeout
await page.waitForTimeout(500); // Small delay for Firefox DOM updates
await expect(locator).toBeVisible({ timeout: timeout * 1.2 });
if (stabilityWait > 0) {
  await page.waitForTimeout(stabilityWait);
}
  } else {
// Standard handling for Chromium
await expect(locator).toBeVisible({ timeout });
if (stabilityWait > 0) {
  await page.waitForTimeout(stabilityWait);
}
  }
}

/**
 * Browser-aware navigation with appropriate wait strategies
 * @param page - Playwright page instance
 * @param url - URL to navigate to
 * @param browserName - Browser name
 * @param options - Navigation options
 */
export async function navigateWithBrowserSupport(
  page: Page,
  url: string,
  browserName: string,
  options: {
waitForNetworkIdle?: boolean;
additionalWait?: number;
  } = {},
) {
  const { waitForNetworkIdle = true, additionalWait = 0 } = options;

  await page.goto(url);

  if (waitForNetworkIdle) {
if (browserName === 'webkit') {
  await page.waitForLoadState('networkidle', { timeout: 45000 });
  await page.waitForTimeout(2000); // Extra stability for WebKit
} else if (browserName === 'firefox') {
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(1000); // Extra time for Firefox DOM updates
} else {
  await page.waitForLoadState('networkidle');
}
  }

  if (additionalWait > 0) {
await page.waitForTimeout(additionalWait);
  }
}

/**
 * Browser-aware button click with retry logic
 * @param page - Playwright page instance
 * @param selector - Button selector or locator
 * @param browserName - Browser name
 * @param options - Click options
 */
export async function clickButtonWithBrowserSupport(
  page: Page,
  selector: string | ReturnType<Page['locator']>,
  browserName: string,
  options: {
waitBeforeClick?: number;
retries?: number;
  } = {},
) {
  const { waitBeforeClick = 0, retries = 1 } = options;

  const locator =
typeof selector === 'string' ? page.locator(selector) : selector;

  // Wait for button to be visible and enabled
  await waitForElementWithBrowserSupport(page, locator, browserName);
  await expect(locator).toBeEnabled({ timeout: 10000 });

  if (waitBeforeClick > 0) {
await page.waitForTimeout(waitBeforeClick);
  }

  if (browserName === 'webkit' && retries > 0) {
// WebKit sometimes needs retry for clicks
let attempts = 0;
const maxAttempts = retries + 1;

while (attempts < maxAttempts) {
  try {
await locator.click();
return;
  } catch (error) {
attempts++;
if (attempts === maxAttempts) {
  throw error;
}
console.log(`⚠️ WebKit: Retry click ${attempts}/${maxAttempts}`);
await page.waitForTimeout(500);
  }
}
  } else {
await locator.click();
  }
}

/**
 * Enhanced form filling with browser-specific handling
 * @param page - Playwright page instance
 * @param inputs - Array of input configurations
 * @param browserName - Browser name
 */
export async function fillFormWithBrowserSupport(
  page: Page,
  inputs: Array<{
selector: string;
value: string;
waitBefore?: number;
  }>,
  browserName: string,
) {
  for (const input of inputs) {
const { selector, value, waitBefore = 0 } = input;

if (waitBefore > 0) {
  await page.waitForTimeout(waitBefore);
}

await waitForElementWithBrowserSupport(page, selector, browserName);

const inputField = page.locator(selector);
await inputField.clear();
await inputField.fill(value);

// Firefox sometimes needs extra time for form updates
if (browserName === 'firefox') {
  await page.waitForTimeout(200);
}
  }
}
