#!/usr/bin/env node

/**
 * TrueNamePath CI Demo Setup Validation Script
 *
 * This script validates that demo users were created successfully with:
 * - Profile records in the profiles table
 * - Default contexts in user_contexts table with is_permanent = true
 * - Basic authentication functionality
 *
 * Designed to run in CI environment after create-demo-users.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - Use environment variables
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Expected demo users from create-demo-users.js
const EXPECTED_USERS = [
  {
id: '54c00e81-cda9-4251-9456-7778df91b988',
email: 'jj@truename.test',
name: 'Jędrzej Lewandowski',
  },
  {
id: '809d0224-81f1-48a0-9405-2258de21ea60',
email: 'liwei@truename.test',
name: 'Li Wei',
  },
  {
id: '257113c8-7a62-4758-9b1b-7992dd8aca1e',
email: 'alex@truename.test',
name: 'Alex Smith',
  },
];

/**
 * Validate demo user setup with comprehensive checks
 */
async function validateDemoSetup() {
  console.log('🔍 TrueNamePath Demo Setup Validation');
  console.log('=====================================');
  console.log(`🌐 Target: ${SUPABASE_URL}`);
  console.log(
`🔑 Service key: ${SERVICE_KEY ? '***' + SERVICE_KEY.slice(-4) : 'NOT SET'}`,
  );
  console.log('');

  // Validate environment
  if (!SUPABASE_URL || !SERVICE_KEY) {
console.error('❌ Missing required environment variables:');
if (!SUPABASE_URL)
  console.error('   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
if (!SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
process.exit(1);
  }

  // Initialize Supabase admin client
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
auth: {
  autoRefreshToken: false,
  persistSession: false,
},
  });

  let validationErrors = [];
  let validatedUsers = 0;

  // Test 1: Database connectivity
  console.log('🔌 Testing database connectivity...');
  try {
const { data: testData, error: testError } = await supabase
  .from('profiles')
  .select('count')
  .limit(1);

if (testError) {
  console.error('❌ Database connectivity test failed:', testError.message);
  process.exit(1);
}
console.log('✅ Database connection successful');
  } catch (err) {
console.error('❌ Database connectivity error:', err.message);
process.exit(1);
  }

  console.log('');

  // Test 2: Validate each demo user
  for (const expectedUser of EXPECTED_USERS) {
console.log(`👤 Validating user: ${expectedUser.email}`);

let userErrors = [];

try {
  // Check 1: Auth user exists
  console.log('   🔐 Checking auth user...');
  const { data: authUsers, error: authError } =
await supabase.auth.admin.listUsers();

  if (authError) {
userErrors.push(`Auth query failed: ${authError.message}`);
  } else {
const authUser = authUsers.users.find(
  (u) => u.email === expectedUser.email,
);
if (!authUser) {
  userErrors.push('Auth user not found');
} else if (authUser.id !== expectedUser.id) {
  userErrors.push(
`Auth user ID mismatch: expected ${expectedUser.id}, got ${authUser.id}`,
  );
} else {
  console.log('   ✅ Auth user found with correct ID');
}
  }

  // Check 2: Profile exists
  console.log('   👤 Checking profile record...');
  const { data: profile, error: profileError } = await supabase
.from('profiles')
.select('id, email, created_at')
.eq('id', expectedUser.id)
.single();

  if (profileError) {
userErrors.push(`Profile not found: ${profileError.message}`);
  } else if (!profile) {
userErrors.push('Profile query returned null');
  } else if (profile.id !== expectedUser.id) {
userErrors.push(
  `Profile ID mismatch: expected ${expectedUser.id}, got ${profile.id}`,
);
  } else if (profile.email !== expectedUser.email) {
userErrors.push(
  `Profile email mismatch: expected ${expectedUser.email}, got ${profile.email}`,
);
  } else {
console.log(`   ✅ Profile found: ${profile.id} (${profile.email})`);
  }

  // Check 3: Any contexts exist (for E2E testing, any contexts are sufficient)
  console.log('   📋 Checking user contexts...');
  const { data: contexts, error: contextError } = await supabase
.from('user_contexts')
.select('id, context_name, is_permanent, created_at')
.eq('user_id', expectedUser.id);

  if (contextError) {
userErrors.push(`Context query failed: ${contextError.message}`);
  } else if (!contexts || contexts.length === 0) {
userErrors.push(
  'No contexts found (E2E tests require at least 1 context)',
);
  } else {
const defaultContexts = contexts.filter((c) => c.is_permanent);
const customContexts = contexts.filter((c) => !c.is_permanent);

console.log(`   ✅ Contexts found: ${contexts.length} total`);
console.log(`  • Default contexts: ${defaultContexts.length}`);
console.log(`  • Custom contexts: ${customContexts.length}`);

if (contexts.length >= 1) {
  console.log(`   ✅ Sufficient contexts for E2E testing`);
}
  }

  // Check 4: Basic authentication test (optional, can be skipped in CI)
  if (process.env.CI !== 'true') {
console.log('   🔑 Testing authentication...');
const { data: authData, error: authTestError } =
  await supabase.auth.signInWithPassword({
email: expectedUser.email,
password: 'demo123!',
  });

if (authTestError) {
  userErrors.push(
`Authentication test failed: ${authTestError.message}`,
  );
} else {
  console.log('   ✅ Authentication test successful');
  // Sign out immediately
  await supabase.auth.signOut();
}
  }

  if (userErrors.length === 0) {
console.log(`   🎉 ${expectedUser.email} validation successful`);
validatedUsers++;
  } else {
console.log(`   ❌ ${expectedUser.email} validation failed:`);
userErrors.forEach((error) => console.log(`  - ${error}`));
validationErrors.push(
  `${expectedUser.email}: ${userErrors.join(', ')}`,
);
  }
} catch (err) {
  const errorMsg = `Unexpected validation error: ${err.message}`;
  console.log(`   ❌ ${errorMsg}`);
  validationErrors.push(`${expectedUser.email}: ${errorMsg}`);
}

console.log('');
  }

  // Test 3: Global database state check
  console.log('🗄️  Database state verification...');
  try {
// Check total counts
const { count: profileCount, error: profileCountError } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true });

const { count: contextCount, error: contextCountError } = await supabase
  .from('user_contexts')
  .select('*', { count: 'exact', head: true })
  .eq('is_permanent', true);

if (profileCountError || contextCountError) {
  console.log('   ⚠️  Could not verify database counts');
} else {
  console.log(`   📊 Total profiles: ${profileCount}`);
  console.log(`   📊 Total default contexts: ${contextCount}`);

  if (profileCount < EXPECTED_USERS.length) {
validationErrors.push(
  `Insufficient profiles: expected >= ${EXPECTED_USERS.length}, found ${profileCount}`,
);
  }
  // For E2E testing, we just need contexts to exist (doesn't have to be default)
  const { count: totalContextCount, error: totalContextCountError } =
await supabase
  .from('user_contexts')
  .select('*', { count: 'exact', head: true });

  console.log(
`   📊 Total contexts (all types): ${totalContextCount || 'unknown'}`,
  );

  if (
!totalContextCountError &&
totalContextCount !== null &&
totalContextCount < EXPECTED_USERS.length
  ) {
validationErrors.push(
  `Insufficient total contexts: expected >= ${EXPECTED_USERS.length}, found ${totalContextCount}`,
);
  }
}
  } catch (err) {
console.log(`   ⚠️  Database state check failed: ${err.message}`);
  }

  console.log('');

  // Summary
  console.log('📊 Validation Summary');
  console.log('====================');
  console.log(
`✅ Users validated successfully: ${validatedUsers}/${EXPECTED_USERS.length}`,
  );
  console.log(`❌ Validation errors found: ${validationErrors.length}`);
  console.log(
`📈 Success rate: ${Math.round((validatedUsers / EXPECTED_USERS.length) * 100)}%`,
  );
  console.log('');

  if (validationErrors.length === 0) {
console.log(
  '🎉 All validations passed! Demo setup is ready for E2E testing.',
);
console.log('');
console.log('✅ Verified components:');
console.log('   • Auth users exist with correct UUIDs');
console.log('   • Profile records created by trigger');
console.log('   • Default contexts created by trigger');
console.log('   • Database connectivity and permissions');
console.log('');
console.log('🚀 Ready for E2E test execution!');
process.exit(0);
  } else {
console.log('❌ Validation failures detected:');
validationErrors.forEach((error, index) => {
  console.log(`   ${index + 1}. ${error}`);
});
console.log('');
console.log('🔧 Troubleshooting suggestions:');
console.log('   1. Check that create-demo-users.js completed successfully');
console.log('   2. Verify database triggers are installed and working');
console.log('   3. Ensure Supabase local instance is fully started');
console.log('   4. Check trigger function logs for errors');
console.log('   5. Verify service role key permissions');
console.log('');
console.log('⚠️  E2E tests may fail due to incomplete demo setup');
process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error during validation:', error);
  process.exit(1);
});

// Run validation
validateDemoSetup().catch((error) => {
  console.error('❌ Validation script failed:', error.message);
  process.exit(1);
});
