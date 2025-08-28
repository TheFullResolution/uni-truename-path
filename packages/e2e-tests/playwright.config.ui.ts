/* eslint-env node */
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load local environment variables if available
if (existsSync('./.env.local')) {
  config({ path: './.env.local' });
}

/**
 * Playwright Configuration for UI Mode
 *
 * This configuration is specifically designed for Playwright UI mode development.
 *
 * KEY DIFFERENCES FROM CLI MODE:
 * - NO setup project dependencies (UI mode design limitation)
 * - Tests use getOrCreateTestUser() which handles authentication gracefully
 * - StorageState is loaded if available, but localStorage may need repopulation
 *
 * HOW TO USE:
 * - First time: Run `yarn test:ui:setup` to create auth state, then launch UI
 * - Subsequent runs: Use `yarn test:ui` directly
 * - If authentication expires: Delete playwright/.auth/ folder and run setup again
 *
 * WHY THIS WORKS:
 * - UI mode intentionally doesn't support setup dependencies for better test visibility
 * - Our tests now use fallback authentication that works in both CLI and UI modes
 * - This follows Playwright's recommended patterns for dual-mode compatibility
 *
 * @see https://playwright.dev/docs/test-configuration
 * @see https://playwright.dev/docs/test-ui-mode
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

  use: {
baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
trace: 'on-first-retry',
screenshot: 'only-on-failure',

// Use existing authentication state if available
// This allows UI mode to work with previously created auth
storageState: existsSync('playwright/.auth/user.json')
  ? 'playwright/.auth/user.json'
  : undefined,
  },

  // Projects configuration for UI mode - NO dependencies
  // This ensures all tests are visible in the UI without setup project filtering
  projects: process.env.CI
? [
// CI configuration with all browsers but NO setup dependencies
{
  name: 'chromium',
  use: {
...devices['Desktop Chrome'],
// Use stored authentication state if available
storageState: existsSync('playwright/.auth/user.json')
  ? 'playwright/.auth/user.json'
  : undefined,
  },
},
{
  name: 'firefox',
  use: {
...devices['Desktop Firefox'],
// Use stored authentication state if available
storageState: existsSync('playwright/.auth/user.json')
  ? 'playwright/.auth/user.json'
  : undefined,
  },
},
{
  name: 'webkit',
  use: {
...devices['Desktop Safari'],
// Use stored authentication state if available
storageState: existsSync('playwright/.auth/user.json')
  ? 'playwright/.auth/user.json'
  : undefined,
actionTimeout: 30000,
navigationTimeout: 30000,
  },
  timeout: 60000,
  retries: 3,
},
{
  name: 'mobile',
  use: {
...devices['iPhone 13'],
// Use stored authentication state if available
storageState: existsSync('playwright/.auth/user.json')
  ? 'playwright/.auth/user.json'
  : undefined,
  },
},
  ]
: [
// Local development configuration - single browser for UI mode
{
  name: 'chromium',
  use: {
...devices['Desktop Chrome'],
// Use stored authentication state if available
storageState: existsSync('playwright/.auth/user.json')
  ? 'playwright/.auth/user.json'
  : undefined,
  },
  // NO dependencies - this is key for UI visibility
},
  ],

  // WebServer configuration - same as main config
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
  ],
});
