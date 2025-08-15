/**
 * Shared Test Infrastructure for E2E Performance Optimization
 *
 * This module provides optimized test patterns to eliminate performance bottlenecks:
 * - Shared user sessions across tests
 * - Session injection instead of browser authentication
 * - Optimized cleanup strategies
 * - Context-specific data management
 *
 * Date: August 14, 2025
 * Academic Project: TrueNamePath E2E Test Optimization
 */

import { Page } from '@playwright/test';
import { AuthTestHelper } from './auth-helpers';
import { DatabaseTestHelper } from './db-helpers';

export interface SharedTestUser {
  email: string;
  userId: string;
  token: string;
}

export interface TestSuiteConfig {
  suiteName: string;
  sharedUser?: SharedTestUser;
  cleanupStrategy: 'full' | 'contexts-only' | 'none';
}

/**
 * Optimized test setup patterns for different test categories
 */
export class SharedTestSetup {
  /**
   * Create a shared test user for an entire test suite
   * Use in beforeAll() instead of creating users per test
   */
  static async createSharedUser(baseEmail: string): Promise<SharedTestUser> {
// For shared users, use consistent email without timestamp to enable reuse
const email = baseEmail;

console.log(`🔍 Checking for existing shared test user: ${email}`);

// Check if user already exists in database
const existingProfile = await DatabaseTestHelper.getProfileByEmail(email);
if (existingProfile) {
  console.log(
`♻️  Reusing existing shared test user: ${existingProfile.id}`,
  );

  // For existing users, create session directly without user creation
  try {
const { token } =
  await AuthTestHelper.createSessionForExistingUser(email);
return { email, userId: existingProfile.id!, token };
  } catch (error) {
console.log(
  `⚠️  Session creation failed, falling back to user creation`,
);
// Fall through to user creation if session fails
  }
}

console.log(`🚀 Creating new shared test user: ${email}`);

const { userId, token } = await AuthTestHelper.createTestUserSession(email);

console.log(`✅ Shared test user ready: ${userId}`);

return { email, userId, token };
  }

  /**
   * Clean up shared test user (use in afterAll)
   */
  static async cleanupSharedUser(sharedUser: SharedTestUser): Promise<void> {
console.log(`🧹 Cleaning up shared user: ${sharedUser.email}`);

await DatabaseTestHelper.cleanupUser(sharedUser.userId);
await AuthTestHelper.cleanupTestUsers();

console.log(`✅ Shared user cleanup complete`);
  }

  /**
   * Authenticate user via browser login (reliable fallback)
   * Use this instead of complex session injection that was causing JWT errors
   */
  static async authenticateViaBrowserLogin(
page: Page,
sharedUser: SharedTestUser,
  ): Promise<void> {
console.log(`🔐 Authenticating via browser login: ${sharedUser.email}`);

// Go to login page
await page.goto('/auth/login');

// Fill login form (use more robust selectors for Mantine components)
await page.fill('input[placeholder="user@example.com"]', sharedUser.email);
await page.fill('input[type="password"]', 'test-password-123'); // Match AuthTestHelper password

// Submit login
await page.click('button[type="submit"]');

// Wait for successful login (redirect to dashboard or intended page)
await page.waitForURL(/\/(dashboard|contexts)/, { timeout: 10000 });

console.log(`✅ Browser login successful for: ${sharedUser.email}`);
  }

  /**
   * Navigate to protected page with authentication (uses browser login)
   */
  static async goToAuthenticatedPage(
page: Page,
sharedUser: SharedTestUser,
path: string,
  ): Promise<void> {
// Use reliable browser login instead of session injection
await this.authenticateViaBrowserLogin(page, sharedUser);

// Navigate to intended path
await page.goto(path);

// Wait for page to load
await page.waitForTimeout(1000);
  }

  /**
   * Clean only user contexts and related data (keep user for reuse)
   * Use in afterEach() instead of full cleanup
   */
  static async cleanupUserContextsOnly(userId: string): Promise<void> {
// Use the improved cleanup method from DatabaseTestHelper
await DatabaseTestHelper.cleanupUserContextsOnly(userId);
  }

  /**
   * Create test context data efficiently (batch operations)
   */
  static async createTestContexts(
userId: string,
contexts: Array<{ name: string; description: string }>,
  ): Promise<any[]> {
const results = [];

for (const context of contexts) {
  const result = await DatabaseTestHelper.createTestContext(
userId,
context.name,
context.description,
  );
  results.push(result);
}

return results;
  }

  /**
   * Performance monitoring utilities
   */
  static startPerformanceTimer(testName: string): number {
const start = Date.now();
console.log(`⏱️  Starting performance timer for: ${testName}`);
return start;
  }

  static endPerformanceTimer(testName: string, startTime: number): void {
const duration = Date.now() - startTime;
console.log(`⏱️  ${testName} completed in ${duration}ms`);

if (duration > 10000) {
  console.warn(`⚠️  Slow test detected: ${testName} took ${duration}ms`);
}
  }
}

/**
 * Test suite configurations for different test categories
 */
export const TEST_SUITE_CONFIGS = {
  CONTEXT_MANAGEMENT: {
suiteName: 'Context Management',
cleanupStrategy: 'contexts-only' as const,
  },
  DASHBOARD: {
suiteName: 'Dashboard',
cleanupStrategy: 'contexts-only' as const,
  },
  AUTH_FLOW: {
suiteName: 'Authentication Flow',
cleanupStrategy: 'full' as const, // Auth tests need unique users
  },
  API_ENDPOINTS: {
suiteName: 'API Endpoints',
cleanupStrategy: 'contexts-only' as const,
  },
} as const;

/**
 * Global shared users cache to prevent duplicate creation across test files
 */
const globalSharedUsers = new Map<string, SharedTestUser>();

/**
 * Helper for test files to implement optimized patterns
 */
export class OptimizedTestPattern {
  private sharedUser?: SharedTestUser;
  private config: TestSuiteConfig;
  private performanceTimers: Map<string, number> = new Map();
  private suiteInitialized: boolean = false;

  constructor(config: TestSuiteConfig) {
this.config = config;
  }

  /**
   * Setup for beforeAll() - creates shared user if needed
   */
  async setupSuite(): Promise<void> {
if (this.suiteInitialized) {
  console.log(`⚠️  Suite already initialized for ${this.config.suiteName}`);
  return;
}

if (this.config.cleanupStrategy !== 'full') {
  const userKey = this.config.suiteName.toLowerCase().replace(/\s+/g, '-');
  const baseEmail = `${userKey}@example.com`;

  // Check global cache first
  if (globalSharedUsers.has(userKey)) {
this.sharedUser = globalSharedUsers.get(userKey);
console.log(
  `♻️  Reusing cached shared user for ${this.config.suiteName}`,
);
  } else {
// Create new shared user and cache it globally
this.sharedUser = await SharedTestSetup.createSharedUser(baseEmail);
globalSharedUsers.set(userKey, this.sharedUser);
console.log(`💾 Cached shared user for ${this.config.suiteName}`);
  }
}

this.suiteInitialized = true;
console.log(`✅ Suite setup complete for ${this.config.suiteName}`);
  }

  /**
   * Cleanup for afterAll() - only cleanup contexts, keep shared user for reuse
   */
  async teardownSuite(): Promise<void> {
if (this.sharedUser && this.suiteInitialized) {
  // Only cleanup contexts, keep shared user for reuse across test runs
  await SharedTestSetup.cleanupUserContextsOnly(this.sharedUser.userId);
  this.suiteInitialized = false;
  console.log(
`✅ Suite teardown complete for ${this.config.suiteName} (user preserved)`,
  );
}
  }

  /**
   * Setup for beforeEach() - optimized per-test setup
   */
  async setupTest(testName: string): Promise<void> {
const timer = SharedTestSetup.startPerformanceTimer(testName);
this.performanceTimers.set(testName, timer);

if (this.sharedUser && this.config.cleanupStrategy === 'contexts-only') {
  await SharedTestSetup.cleanupUserContextsOnly(this.sharedUser.userId);
}
  }

  /**
   * Cleanup for afterEach() - optimized per-test cleanup
   */
  async teardownTest(testName: string): Promise<void> {
const startTime = this.performanceTimers.get(testName);
if (startTime) {
  SharedTestSetup.endPerformanceTimer(testName, startTime);
  this.performanceTimers.delete(testName);
}

if (this.config.cleanupStrategy === 'full') {
  // Only for auth tests that need unique users
  await DatabaseTestHelper.cleanup();
  await AuthTestHelper.cleanupTestUsers();
}
  }

  /**
   * Get shared user for tests
   */
  getSharedUser(): SharedTestUser {
if (!this.sharedUser) {
  throw new Error('Shared user not available. Check suite configuration.');
}
return this.sharedUser;
  }

  /**
   * Authenticate with shared user (for UI tests)
   */
  async authenticateWithSharedUser(
page: Page,
path: string = '/dashboard',
  ): Promise<void> {
if (!this.sharedUser) {
  throw new Error('Shared user not available for authentication');
}
console.log(`🎯 Authenticating shared user for path: ${path}`);
await SharedTestSetup.goToAuthenticatedPage(page, this.sharedUser, path);
  }
}
