/* eslint-env node */
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load local environment variables if available
if (existsSync('./.env.local')) {
  config({ path: './.env.local' });
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Disable parallel execution for database tests
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Force single worker to avoid database conflicts
  workers: 1,
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],

  // Simplified test infrastructure - no global setup needed

  use: {
baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
trace: 'on-first-retry',
screenshot: 'only-on-failure',
  },

  projects: [
// Setup project - runs once to create authenticated state
{
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
},

// Main test projects with authentication state - Optimized for CI performance
...(process.env.CI
  ? [
  // Primary browser: Chrome (most tests)
  {
name: 'chromium',
use: {
  ...devices['Desktop Chrome'],
  storageState: 'playwright/.auth/user.json',
},
dependencies: ['setup'],
  },
  // Secondary browser: Firefox (essential tests only)
  {
name: 'firefox',
use: {
  ...devices['Desktop Firefox'],
  storageState: 'playwright/.auth/user.json',
  actionTimeout: 20000, // Increased timeout for Firefox
  navigationTimeout: 30000, // Longer navigation timeout
},
dependencies: ['setup'],
// Run fewer tests on Firefox for performance
testIgnore: [
  '**/dashboard-layout.spec.ts',
  '**/realtime-updates.spec.ts',
  '**/context-constraints.spec.ts',
],
  },
  // WebKit: Only critical OAuth tests
  {
name: 'webkit-critical',
use: {
  ...devices['Desktop Safari'],
  storageState: 'playwright/.auth/user.json',
  actionTimeout: 35000, // Increased for WebKit
  navigationTimeout: 45000, // Much longer navigation timeout
  viewport: { width: 1280, height: 720 }, // Consistent viewport
},
timeout: 90000, // Increased overall test timeout
retries: 3, // Increased retries for flaky WebKit
dependencies: ['setup'],
// Only run critical OAuth and signup tests on WebKit
testMatch: [
  '**/demo-oauth-flows.spec.ts',
  '**/oauth-complete-flow.spec.ts',
  '**/user-signup-flow.spec.ts',
],
  },
  // Mobile removed - not critical for this academic project
]
  : [
  // Local development: Chrome only for faster iteration
  {
name: 'chromium',
use: {
  ...devices['Desktop Chrome'],
  storageState: 'playwright/.auth/user.json',
},
dependencies: ['setup'],
  },
]),
  ],

  webServer: [
{
  // Main TrueNamePath application
  command: process.env.CI
? 'yarn workspace @uni-final/web start'
: 'yarn workspace @uni-final/web dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000,
  cwd: '../../', // Run commands from project root
},
{
  // Demo HR application for OAuth integration tests
  command: 'yarn workspace @uni-final/demo-hr dev',
  url: 'http://localhost:4000',
  reuseExistingServer: !process.env.CI,
  timeout: 30 * 1000,
  cwd: '../../', // Run commands from project root
},
{
  // Demo Chat application for OAuth integration tests
  command: 'yarn workspace @uni-final/demo-chat dev',
  url: 'http://localhost:4500',
  reuseExistingServer: !process.env.CI,
  timeout: 30 * 1000,
  cwd: '../../', // Run commands from project root
},
  ],
});
