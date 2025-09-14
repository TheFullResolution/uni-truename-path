/* eslint-env node */
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for production keep-alive tests
 *
 * This config is specifically designed for running the keep-alive test
 * against the production Supabase deployment to maintain project activity.
 *
 * Key differences from the main config:
 * - Points to production URL (no local servers)
 * - Optimized for headless CI execution
 * - Only runs the keep-alive test file
 * - Uses production environment variables
 * - Minimal retries and timeouts for faster execution
 */
export default defineConfig({
  testDir: './tests/keep-alive',
  // Only run the keep-alive test (now in its own directory)
  testMatch: '**/keep-alive.spec.ts',

  // CI-optimized settings
  fullyParallel: false,
  forbidOnly: true,
  retries: 2, // Retry failed tests up to 2 times
  workers: 1, // Single worker for simplicity

  // Minimal reporter for CI logs
  reporter: [
['list'],
['json', { outputFile: 'test-results/keep-alive-results.json' }],
  ],

  use: {
// Production URL - will be set via environment variable
baseURL: process.env.KEEP_ALIVE_BASE_URL || 'https://www.truenamepath.com',

// CI-optimized browser settings
headless: true,
trace: 'retain-on-failure',
screenshot: 'only-on-failure',
video: 'retain-on-failure',

// Timeouts
actionTimeout: 15000,
navigationTimeout: 30000,
  },

  // Global test timeout (per test)
  timeout: 120000, // 2 minutes should be enough for keep-alive operations

  projects: [
{
  name: 'keep-alive-chromium',
  use: {
...devices['Desktop Chrome'],
// No persistent storage state - each run creates fresh user
  },
},
  ],

  // No local web servers - we're testing production
  webServer: undefined,

  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,

  // Environment variables validation
  // These should be set in GitHub Actions secrets
  expect: {
// More lenient timeouts for production environment
timeout: 10000,
  },
});
