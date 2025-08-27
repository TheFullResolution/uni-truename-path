/* eslint-env node */
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables from .env.local if it exists
// Check both package-local and project root .env files
if (existsSync('./.env.local')) {
  config({ path: './.env.local' });
  console.log('✅ Loaded .env.local from current directory');
} else if (existsSync('../../.env.local')) {
  config({ path: '../../.env.local' });
  console.log('✅ Loaded .env.local from project root');
} else if (existsSync('./.env')) {
  config({ path: './.env' });
  console.log('✅ Loaded .env from current directory');
} else {
  console.warn('⚠️  No .env.local or .env file found');
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
  use: {
...devices['Desktop Safari'],
actionTimeout: 30000, // 30s for actions in WebKit CI
navigationTimeout: 30000, // 30s for navigation in WebKit CI
  },
  timeout: 60000, // Give WebKit tests more time
  retries: 3, // More retries for WebKit specifically
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
reuseExistingServer: true,
timeout: process.env.CI ? 60 * 1000 : 30 * 1000,
cwd: '../../', // Run commands from project root
  },
});
