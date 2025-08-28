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

// Main test projects with authentication state
...(process.env.CI
  ? [
  {
name: 'chromium',
use: {
  ...devices['Desktop Chrome'],
  // Use stored authentication state
  storageState: 'playwright/.auth/user.json',
},
dependencies: ['setup'],
  },
  {
name: 'firefox',
use: {
  ...devices['Desktop Firefox'],
  // Use stored authentication state
  storageState: 'playwright/.auth/user.json',
},
dependencies: ['setup'],
  },
  {
name: 'webkit',
use: {
  ...devices['Desktop Safari'],
  // Use stored authentication state
  storageState: 'playwright/.auth/user.json',
  actionTimeout: 30000, // 30s for actions in WebKit CI
  navigationTimeout: 30000, // 30s for navigation in WebKit CI
},
timeout: 60000, // Give WebKit tests more time
retries: 3, // More retries for WebKit specifically
dependencies: ['setup'],
  },
  {
name: 'mobile',
use: {
  ...devices['iPhone 13'],
  // Use stored authentication state
  storageState: 'playwright/.auth/user.json',
},
dependencies: ['setup'],
  },
]
  : [
  {
name: 'chromium',
use: {
  ...devices['Desktop Chrome'],
  // Use stored authentication state
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
  ],
});
