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
// Use test environment variables (not Next.js browser variables)
// Tests should use local Supabase for isolated testing
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error(
'Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set',
  );
}

// Use service role if available, otherwise anon key (will fail gracefully)
const supabaseKey = serviceRoleKey || anonKey;

// supabaseKey is guaranteed to exist (anonKey is required above)

const supabase = createClient(supabaseUrl, supabaseKey);

if (!serviceRoleKey) {
  // If no service role key, we can't create users - use existing demo users
  console.warn(
'No SUPABASE_SERVICE_ROLE_KEY available. Tests need existing demo users.',
  );
  console.warn('Run: node scripts/create-demo-users.js first');

  // Try to authenticate with demo credentials if this is a known demo email
  if (
email.includes('jj-test-') ||
email.includes('liwei-test-') ||
email.includes('alex-test-')
  ) {
// Map test emails to existing demo users for compatibility
const demoEmail = email.includes('jj-test-')
  ? 'jj@truename.test'
  : email.includes('liwei-test-')
? 'liwei@truename.test'
: 'alex@truename.test';

try {
  const { data: sessionData, error: sessionError } =
await supabase.auth.signInWithPassword({
  email: demoEmail,
  password: 'demo123!',
});

  if (sessionError) {
throw new Error(
  `Demo user authentication failed: ${sessionError.message}`,
);
  }

  return {
userId: sessionData.user?.id || '',
token: sessionData.session?.access_token || '',
  };
} catch (error) {
  throw new Error(
`Demo user not found. Run demo user creation script first.`,
  );
}
  }

  throw new Error(
'Cannot create test users without service role key. Use existing demo users.',
  );
}

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

// Ensure profile exists (trigger may not fire for admin-created users)
if (userId) {
  const { data: profileData, error: profileError } = await supabase
.from('profiles')
.upsert(
  {
id: userId,
email: email,
  },
  {
onConflict: 'id',
  },
)
.select()
.single();

  if (profileError) {
throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  console.log('✅ Profile created/updated:', profileData?.email);
}

// Create session for the test user
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
  // Use test environment variables for cleanup
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
console.log('No SUPABASE_URL available - skipping test user cleanup');
return;
  }

  if (!serviceRoleKey) {
console.log(
  'No service role key available - skipping test user cleanup',
);
return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

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
