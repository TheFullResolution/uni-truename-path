import { Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Mock authentication state
   */
  async mockAuth(email: string = 'test@example.com') {
// Mock Supabase auth session
await this.page.addInitScript((userEmail) => {
  window.localStorage.setItem(
'supabase.auth.token',
JSON.stringify({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: {
id: 'mock-user-id',
email: userEmail,
created_at: new Date().toISOString(),
  },
}),
  );
}, email);
  }

  /**
   * Clear authentication state
   */
  async clearAuth() {
await this.page.evaluate(() => {
  window.localStorage.removeItem('supabase.auth.token');
  window.sessionStorage.clear();
});
  }

  /**
   * Navigate to login page
   */
  async goToLogin() {
await this.page.goto('/auth/login');
  }

  /**
   * Navigate to dashboard
   */
  async goToDashboard() {
await this.page.goto('/dashboard');
  }
}

/**
 * Static auth helper utilities for API testing
 */
export class AuthTestHelper {
  /**
   * Generate a simple mock JWT token for testing API endpoints
   * This creates a basic token structure that should work with the API
   */
  static async generateValidJWT(userId: string): Promise<string> {
// For now, create a simple mock JWT structure for testing
// This should work with the API validation since it's testing mode
const mockPayload = {
  sub: userId,
  email: `test-${userId.substring(0, 8)}@example.com`,
  aud: 'authenticated',
  role: 'authenticated',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
};

// Create a simple base64-encoded mock token for testing
const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const payload = btoa(JSON.stringify(mockPayload));
const signature = btoa('test-signature');

return `${header}.${payload}.${signature}`;
  }

  /**
   * Create a test user session and return authentication data
   */
  static async createTestUserSession(
email: string,
  ): Promise<{ userId: string; token: string }> {
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Try to create or get existing test user
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password: 'test-password-123',
  email_confirm: true,
  user_metadata: { test_user: true },
});

if (error && !error.message.includes('already registered')) {
  throw new Error(`Failed to create test user: ${error.message}`);
}

const userId = data?.user?.id || '';

// Generate token for this user
const token = await AuthTestHelper.generateValidJWT(userId);

return { userId, token };
  }

  /**
   * Clean up test users created during testing
   */
  static async cleanupTestUsers(): Promise<void> {
try {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey =
process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all users with test metadata
  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
console.warn('Could not list users for cleanup:', error);
return;
  }

  // Delete test users
  for (const user of users.users) {
if (
  user.user_metadata?.test_user ||
  user.email?.includes('@example.com')
) {
  await supabase.auth.admin.deleteUser(user.id);
}
  }
} catch (error) {
  console.warn('Test user cleanup error:', error);
}
  }
}
