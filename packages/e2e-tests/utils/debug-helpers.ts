/**
 * E2E Test Debug Helpers
 *
 * Provides debugging utilities for E2E tests to help troubleshoot
 * database state issues and test failures.
 */

import { Page } from '@playwright/test';

export interface DebugOptions {
  userId?: string;
  persona?: string;
  includeNetworkRequests?: boolean;
  includeDatabaseState?: boolean;
}

/**
 * Debug helper that can be called from E2E tests to dump useful information
 * when tests fail or when debugging is needed.
 */
export async function debugTestState(
  page: Page,
  testName: string,
  options: DebugOptions = {},
): Promise<void> {
  console.log(`\n🔍 DEBUG: ${testName}`);
  console.log('=' + '='.repeat(testName.length + 8));

  // Basic page information
  console.log(`📄 Current URL: ${page.url()}`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);

  if (options.userId || options.persona) {
console.log(`👤 Debug focus: ${options.persona || options.userId}`);
  }

  // Check if user is authenticated by looking for common authenticated elements
  try {
const isLoggedIn = await page
  .locator('[data-testid="dashboard"]')
  .isVisible({ timeout: 1000 });
console.log(
  `🔐 Authentication state: ${isLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN'}`,
);
  } catch {
console.log('🔐 Authentication state: UNKNOWN (dashboard not found)');
  }

  // Check for common UI elements that tests might be looking for
  const elementsToCheck = [
{ selector: '[data-testid="tab-contexts"]', name: 'Contexts Tab' },
{
  selector: '[data-testid="edit-assignments-button"]',
  name: 'Edit Assignments Button',
},
{ selector: '[data-testid="context-card"]', name: 'Context Cards' },
{ selector: 'table', name: 'Assignment Table' },
{ selector: 'text=Edit Assignments', name: 'Edit Assignments Modal' },
  ];

  console.log('\n🎯 UI Element Status:');
  for (const element of elementsToCheck) {
try {
  const isVisible = await page
.locator(element.selector)
.isVisible({ timeout: 1000 });
  const count = await page.locator(element.selector).count();
  console.log(
`   ${isVisible ? '✅' : '❌'} ${element.name}: ${isVisible ? `visible (${count} found)` : 'not visible'}`,
  );
} catch {
  console.log(`   ❌ ${element.name}: error checking`);
}
  }

  // Network requests if requested
  if (options.includeNetworkRequests) {
console.log('\n🌐 Recent Network Activity:');
try {
  const requests = await page.evaluate(() => {
// Get recent fetch requests from performance entries if available
if (
  'performance' in window &&
  'getEntriesByType' in window.performance
) {
  const entries = window.performance.getEntriesByType(
'resource',
  ) as PerformanceResourceTiming[];
  return entries
.filter((entry) => entry.name.includes('/api/'))
.slice(-10)
.map((entry) => ({
  url: entry.name,
  duration: entry.duration,
  responseEnd: entry.responseEnd,
}));
}
return [];
  });

  if (requests.length > 0) {
requests.forEach((req, idx) => {
  console.log(
`   ${idx + 1}. ${req.url} (${req.duration.toFixed(2)}ms)`,
  );
});
  } else {
console.log('   No API requests found in performance entries');
  }
} catch {
  console.log('   Could not retrieve network information');
}
  }

  // Console logs and errors
  console.log('\n📝 Browser Console Messages:');
  const logs = await page.evaluate(() => {
// Return recent console messages if they were captured
return (
  (window as any).__testConsoleMessages || ['No console messages captured']
);
  });

  logs.slice(-5).forEach((log: string, idx: number) => {
console.log(`   ${idx + 1}. ${log}`);
  });

  console.log('=' + '='.repeat(testName.length + 8) + '\n');
}

/**
 * Quick debug function for checking contexts availability
 * This addresses the specific issue mentioned in the failing test
 */
export async function debugContextsAvailability(page: Page): Promise<{
  hasContextsTab: boolean;
  hasContextCards: boolean;
  hasEditButtons: boolean;
  contextCount: number;
}> {
  try {
await page.waitForTimeout(1000); // Brief wait for content to load

const hasContextsTab = await page
  .locator('[data-testid="tab-contexts"]')
  .isVisible();
const contextCount = await page
  .locator('[data-testid="edit-assignments-button"]')
  .count();
const hasContextCards = contextCount > 0;
const hasEditButtons = hasContextCards;

const result = {
  hasContextsTab,
  hasContextCards,
  hasEditButtons,
  contextCount,
};

console.log(`\n📋 Contexts Debug:`, result);
return result;
  } catch (error) {
console.log(`❌ Contexts debug failed:`, error);
return {
  hasContextsTab: false,
  hasContextCards: false,
  hasEditButtons: false,
  contextCount: 0,
};
  }
}

/**
 * Run database debug script from within E2E tests
 * This calls the debug-database-state.js script to check database state
 */
export async function debugDatabaseFromTest(persona?: string): Promise<void> {
  if (typeof process !== 'undefined' && process.env) {
console.log('\n🗄️  Running database debug script...');
try {
  // Import and run the debug script
  const { debugDatabaseState } = await import('./debug-database-state.js');
  await debugDatabaseState(persona ? persona : null);
} catch (error) {
  console.log(`❌ Database debug failed: ${error}`);
}
  } else {
console.log('⚠️  Database debug not available in browser context');
  }
}

/**
 * Capture console messages for debugging
 * Call this early in test setup to capture browser console output
 */
export function setupConsoleCapture(page: Page): void {
  const messages: string[] = [];

  page.on('console', (msg) => {
const message = `[${msg.type()}] ${msg.text()}`;
messages.push(message);

// Keep only recent messages
if (messages.length > 20) {
  messages.shift();
}
  });

  // Make messages available to debugTestState
  page.addInitScript(() => {
(window as any).__testConsoleMessages = [];
  });

  page.on('console', (msg) => {
page.evaluate((message) => {
  (window as any).__testConsoleMessages =
(window as any).__testConsoleMessages || [];
  (window as any).__testConsoleMessages.push(message);
  if ((window as any).__testConsoleMessages.length > 20) {
(window as any).__testConsoleMessages.shift();
  }
}, `[${msg.type()}] ${msg.text()}`);
  });
}
