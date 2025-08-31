/* eslint-env node */
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { existsSync } from 'fs';

if (existsSync('./.env.local')) {
  config({ path: './.env.local' });
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],

  use: {
baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
trace: 'on-first-retry',
screenshot: 'only-on-failure',
  },

  projects: [
{
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
},
...(process.env.CI
  ? [
  {
name: 'chromium',
use: {
  ...devices['Desktop Chrome'],
  storageState: 'playwright/.auth/user.json',
},
dependencies: ['setup'],
  },
  {
name: 'firefox',
use: {
  ...devices['Desktop Firefox'],
  storageState: 'playwright/.auth/user.json',
  actionTimeout: 20000,
  navigationTimeout: 30000,
},
dependencies: ['setup'],
testIgnore: [
  '**/dashboard-layout.spec.ts',
  '**/realtime-updates.spec.ts',
  '**/context-constraints.spec.ts',
],
  },
  {
name: 'webkit-critical',
use: {
  ...devices['Desktop Safari'],
  storageState: 'playwright/.auth/user.json',
  actionTimeout: 35000,
  navigationTimeout: 45000,
  viewport: { width: 1280, height: 720 },
},
timeout: 90000,
retries: 3,
dependencies: ['setup'],
testMatch: [
  '**/demo-oauth-flows.spec.ts',
  '**/oauth-complete-flow.spec.ts',
  '**/user-signup-flow.spec.ts',
],
  },
]
  : [
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
  command: process.env.CI
? 'yarn workspace @uni-final/web start'
: 'yarn workspace @uni-final/web dev',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  timeout: process.env.CI ? 60 * 1000 : 30 * 1000,
  cwd: '../../',
},
{
  command: 'yarn workspace @uni-final/demo-hr dev',
  url: 'http://localhost:4000',
  reuseExistingServer: !process.env.CI,
  timeout: 30 * 1000,
  cwd: '../../',
},
{
  command: 'yarn workspace @uni-final/demo-chat dev',
  url: 'http://localhost:4500',
  reuseExistingServer: !process.env.CI,
  timeout: 30 * 1000,
  cwd: '../../',
},
  ],
});
