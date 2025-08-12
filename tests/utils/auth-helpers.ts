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
   * Create a test user session and return authentication data with real Supabase token
   */
  static async createTestUserSession(
email: string,
  ): Promise<{ userId: string; token: string }> {
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Try to create or get existing test user with admin API
const { data: userData, error: createError } =
  await supabase.auth.admin.createUser({
email,
password: 'test-password-123',
email_confirm: true,
user_metadata: { test_user: true },
  });

let userId: string;

if (createError && createError.message.includes('already registered')) {
  // User exists, get their ID
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers.users.find((u) => u.email === email);
  userId = existingUser?.id || '';
} else if (createError) {
  throw new Error(`Failed to create test user: ${createError.message}`);
} else {
  userId = userData?.user?.id || '';
}

// Generate a valid access token using admin API
const { data: tokenData, error: tokenError } =
  await supabase.auth.admin.generateLink({
type: 'magiclink',
email,
  });

if (tokenError) {
  throw new Error(`Failed to generate token: ${tokenError.message}`);
}

// Extract access token from the link or create session directly
// For testing, we'll use the service role key to create a session
const { data: sessionData, error: sessionError } =
  await supabase.auth.signInWithPassword({
email,
password: 'test-password-123',
  });

if (sessionError) {
  throw new Error(`Failed to create session: ${sessionError.message}`);
}

const token = sessionData.session?.access_token || '';

if (!token) {
  throw new Error('No access token received from session');
}

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
