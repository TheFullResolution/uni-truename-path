/* eslint-env node */
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables from .env.local if it exists
if (existsSync('.env.local')) {
  config({ path: '.env.local' });
} else if (existsSync('.env')) {
  config({ path: '.env' });
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

  use: {
baseURL: 'http://localhost:3000',
trace: 'on-first-retry',
screenshot: 'only-on-failure',
  },

  projects: process.env.CI
? [
{
  name: 'chromium',
  use: { ...devices['Desktop Chrome'] },
},
{
  name: 'firefox',
  use: { ...devices['Desktop Firefox'] },
},
{
  name: 'webkit',
  use: { ...devices['Desktop Safari'] },
},
{
  name: 'mobile',
  use: { ...devices['iPhone 13'] },
},
  ]
: [
{
  name: 'chromium',
  use: { ...devices['Desktop Chrome'] },
},
  ],

  webServer: {
// Use production server in CI (already built), dev server locally
command: process.env.CI
  ? 'yarn workspace uni-final-project-web start'
  : 'yarn dev',
url: 'http://localhost:3000',
reuseExistingServer: !process.env.CI,
timeout: process.env.CI ? 60 * 1000 : 120 * 1000,
  },
});
