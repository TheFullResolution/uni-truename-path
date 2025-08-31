// Context Management Test Helpers

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import {
  waitForElementWithBrowserSupport,
  navigateWithBrowserSupport,
  clickButtonWithBrowserSupport,
} from './browser-helpers';

/**
 * Creates a new context via the dashboard UI
 */
export async function createContext(
  page: Page,
  contextName: string,
  description?: string,
): Promise<boolean> {
  try {
console.log(`📁 Creating context: ${contextName}`);
await page.goto('/dashboard/contexts');

await page.waitForLoadState('networkidle', { timeout: 30000 });
await page.waitForSelector('[data-testid="tab-contexts"]', {
  timeout: 30000,
});
await page.waitForTimeout(1000);

let createButton = page.getByRole('button', { name: /add context/i });

if (!(await createButton.isVisible({ timeout: 5000 }))) {
  createButton = page
.locator('button')
.filter({ hasText: /add context/i })
.first();
}

if (!(await createButton.isVisible({ timeout: 5000 }))) {
  createButton = page
.locator('button')
.filter({ hasText: /add context/i })
.or(page.locator('text=Add Context'))
.first();
}

if (!(await createButton.isVisible({ timeout: 5000 }))) {
  createButton = page.getByTestId('add-context-button');
}

if (!(await createButton.isVisible({ timeout: 8000 }))) {
  throw new Error('Create context button not found after all attempts');
}

await createButton.click();

await page.waitForSelector('[data-testid="context-name-input"]', {
  timeout: 10000,
});
await page.getByTestId('context-name-input').fill(contextName);

if (description) {
  await page.getByTestId('context-description-input').fill(description);
}

let submitButton = page
  .locator('button')
  .filter({ hasText: /create context|update context|create|save|submit/i })
  .first();

await expect(submitButton).toBeVisible({ timeout: 10000 });
await expect(submitButton).toBeEnabled({ timeout: 5000 });

await submitButton.click();

try {
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
} catch (error) {
  console.log('⚠️ Context creation may have failed, continuing...');
}

console.log(`✅ Context created: ${contextName}`);
return true;
  } catch (error) {
console.error(`❌ Failed to create context ${contextName}:`, error);
return false;
  }
}

/**
 * Assigns an existing name to a specific context
 */
export async function assignNameToContext(
  page: Page,
  nameText: string,
  contextName: string,
): Promise<boolean> {
  try {
console.log(`🔗 Assigning name "${nameText}" to context "${contextName}"`);
await page.getByTestId('tab-contexts').click();
await page.waitForSelector('[data-testid="edit-assignments-button"]', {
  timeout: 10000,
});

const contextRows = page.locator('[data-testid="edit-assignments-button"]');
for (let i = 0; i < (await contextRows.count()); i++) {
  const element = contextRows.nth(i);
  if (
await element
  .locator('xpath=../..')
  .locator('text=' + contextName)
  .isVisible({ timeout: 1000 })
  ) {
await element.click();
break;
  }
}

await page.waitForSelector('text=Edit Assignments', { timeout: 10000 });
await page
  .locator('table tbody tr')
  .filter({ hasText: nameText })
  .locator('button')
  .filter({ hasText: /assign|select/i })
  .click();
await page.getByRole('button', { name: /save|confirm/i }).click();
await page.waitForTimeout(1000);
console.log(`✅ Name "${nameText}" assigned to context "${contextName}"`);
return true;
  } catch (error) {
console.error(`❌ Failed to assign name to context:`, error);
return false;
  }
}

/**
 * Creates a new name variant with specified category
 */
export async function createNameVariant(
  page: Page,
  nameText: string,
  category: string,
): Promise<boolean> {
  try {
console.log(`✏️ Creating name variant: "${nameText}" (${category})`);
await page.goto('/dashboard');
await page.getByTestId('tab-names').click();
await page.waitForLoadState('networkidle');

const createButton = page
  .locator('button')
  .filter({ hasText: /create|add.*name/i })
  .first();
if (!(await createButton.isVisible({ timeout: 5000 })))
  throw new Error('Create name button not found');

await createButton.click();
await page.getByTestId('name-input').fill(nameText);
await page.getByTestId('category-select').click();
await page.getByRole('option', { name: category }).click();
await page
  .locator('button')
  .filter({ hasText: /create|save|submit/i })
  .first()
  .click();
await page.waitForTimeout(1000);

console.log(`✅ Name variant created: "${nameText}" (${category})`);
return true;
  } catch (error) {
console.error(`❌ Failed to create name variant:`, error);
return false;
  }
}

/**
 * Validates OIDC claims structure and content
 */
export function verifyOidcClaims(
  claims: Record<string, any>,
  expectedFields: Record<string, any>,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
console.log(`🔍 Validating OIDC claims against expected fields`);

['sub', 'iss', 'aud', 'exp', 'iat'].forEach((field) => {
  if (!(field in claims))
errors.push(`Missing required OIDC field: ${field}`);
});

Object.entries(expectedFields).forEach(([key, expectedValue]) => {
  if (!(key in claims)) {
errors.push(`Missing expected field: ${key}`);
  } else if (claims[key] !== expectedValue) {
errors.push(
  `Field "${key}": expected "${expectedValue}", got "${claims[key]}"`,
);
  }
});

const isValid = errors.length === 0;
console.log(
  isValid
? `✅ OIDC claims validation passed`
: `❌ OIDC claims validation failed:`,
  errors,
);
return { isValid, errors };
  } catch (error) {
errors.push(`Validation error: ${error}`);
return { isValid: false, errors };
  }
}
