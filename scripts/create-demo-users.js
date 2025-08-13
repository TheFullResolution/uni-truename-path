#!/usr/bin/env node

/**
 * TrueNamePath Demo User Creation Script
 *
 * Creates the three demo personas as auth users in Supabase production database.
 * This script requires a service role key with admin privileges.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_service_key node scripts/create-demo-users.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - Use local Supabase when available, production as fallback
const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://txfcnjvmkaqzblztkjmr.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Demo user specifications matching the frontend PERSONAS constant
const DEMO_USERS = [
  {
id: '54c00e81-cda9-4251-9456-7778df91b988',
email: 'jj@truename.test',
password: 'demo123!',
user_metadata: {
  name: 'Jędrzej Lewandowski',
  demo_persona: 'jj',
  description:
'Polish developer demonstrating pronunciation/cultural needs',
},
email_confirm: true,
phone_confirm: false,
  },
  {
id: '809d0224-81f1-48a0-9405-2258de21ea60',
email: 'liwei@truename.test',
password: 'demo123!',
user_metadata: {
  name: 'Li Wei',
  demo_persona: 'liwei',
  description:
'Chinese professional demonstrating multi-script name management',
},
email_confirm: true,
phone_confirm: false,
  },
  {
id: '257113c8-7a62-4758-9b1b-7992dd8aca1e',
email: 'alex@truename.test',
password: 'demo123!',
user_metadata: {
  name: 'Alex Smith',
  demo_persona: 'alex',
  description: 'Developer demonstrating online persona management',
},
email_confirm: true,
phone_confirm: false,
  },
];

async function createDemoUsers() {
  // Validate environment
  if (!SERVICE_KEY) {
console.error(
  '❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required',
);
console.error(
  '   Get your service role key from: https://supabase.com/dashboard/project/txfcnjvmkaqzblztkjmr/settings/api',
);
process.exit(1);
  }

  // Initialize Supabase admin client
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
auth: {
  autoRefreshToken: false,
  persistSession: false,
},
  });

  console.log('🚀 TrueNamePath Demo User Creation');
  console.log('==================================');
  console.log('');

  // Check existing users first
  console.log('📋 Checking for existing demo users...');
  const { data: existingUsers, error: checkError } =
await supabase.auth.admin.listUsers();

  if (checkError) {
console.error('❌ Error checking existing users:', checkError.message);
process.exit(1);
  }

  const existingEmails = new Set(existingUsers.users.map((u) => u.email));
  const demoEmails = DEMO_USERS.map((u) => u.email);
  const alreadyExist = demoEmails.filter((email) => existingEmails.has(email));

  if (alreadyExist.length > 0) {
console.log('⚠️  Found existing demo users:', alreadyExist.join(', '));
console.log('   Delete them first or use --force flag to recreate');
  }

  // Create each demo user
  let successCount = 0;
  let errorCount = 0;

  for (const userData of DEMO_USERS) {
console.log('');
console.log(`👤 Creating user: ${userData.email}`);
console.log(`   Name: ${userData.user_metadata.name}`);
console.log(`   ID: ${userData.id}`);

try {
  const { data, error } = await supabase.auth.admin.createUser({
email: userData.email,
password: userData.password,
user_metadata: userData.user_metadata,
email_confirm: userData.email_confirm,
phone_confirm: userData.phone_confirm,
  });

  if (error) {
console.error(`   ❌ Error: ${error.message}`);
errorCount++;
  } else {
console.log(`   ✅ Success! User ID: ${data.user.id}`);
successCount++;

// Verify the user can authenticate with correct ID
console.log(`   🔐 Testing authentication...`);
const { data: authData, error: authError } =
  await supabase.auth.signInWithPassword({
email: userData.email,
password: userData.password,
  });

if (authError) {
  console.error(
`   ⚠️  Authentication test failed: ${authError.message}`,
  );
} else {
  console.log(`   ✅ Authentication test successful`);
  // Sign out immediately
  await supabase.auth.signOut();
}
  }
} catch (err) {
  console.error(`   ❌ Unexpected error:`, err.message);
  errorCount++;
}
  }

  // Summary
  console.log('');
  console.log('📊 Summary');
  console.log('==========');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed to create: ${errorCount} users`);
  console.log('');

  if (successCount === DEMO_USERS.length) {
console.log('🎉 All demo users created successfully!');
console.log('');
console.log('🔑 Demo Login Credentials:');
DEMO_USERS.forEach((user) => {
  console.log(`   • ${user.email} / ${user.password}`);
});
console.log('');
console.log('🌐 Test the login at: http://localhost:3000/login-demo');
  } else {
console.log('⚠️  Some users failed to create. Check errors above.');
process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
createDemoUsers().catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});

export { createDemoUsers, DEMO_USERS };
