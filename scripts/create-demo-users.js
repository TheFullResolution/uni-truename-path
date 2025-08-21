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

/**
 * Wait for trigger chain to complete with retries
 */
async function waitForTriggerChain(
  supabase,
  userId,
  email,
  maxRetries = 10,
  delayMs = 500,
) {
  console.log(`   ⏳ Waiting for trigger chain completion...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
console.log(
  `   🔄 Attempt ${attempt}/${maxRetries}: Checking profile and context creation...`,
);

try {
  // Check if profile was created by trigger
  const { data: profile, error: profileError } = await supabase
.from('profiles')
.select('id, email, created_at')
.eq('id', userId)
.single();

  if (profileError) {
console.log(`   ❌ Profile not found yet: ${profileError.message}`);
if (attempt < maxRetries) {
  console.log(`   ⏳ Waiting ${delayMs}ms before retry...`);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  continue;
} else {
  throw new Error(
`Profile creation failed after ${maxRetries} attempts: ${profileError.message}`,
  );
}
  }

  console.log(`   ✅ Profile created: ${profile.id} (${profile.email})`);

  // Check if default context was created by trigger
  const { data: contexts, error: contextError } = await supabase
.from('user_contexts')
.select('id, context_name, is_permanent, created_at')
.eq('user_id', userId)
.eq('is_permanent', true);

  if (contextError) {
console.log(`   ❌ Context query failed: ${contextError.message}`);
if (attempt < maxRetries) {
  console.log(`   ⏳ Waiting ${delayMs}ms before retry...`);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  continue;
} else {
  throw new Error(
`Context query failed after ${maxRetries} attempts: ${contextError.message}`,
  );
}
  }

  if (!contexts || contexts.length === 0) {
console.log(`   ❌ Default context not found yet`);
if (attempt < maxRetries) {
  console.log(`   ⏳ Waiting ${delayMs}ms before retry...`);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  continue;
} else {
  // Attempt manual context creation as fallback
  console.log(
`   🔧 Attempting manual context creation as fallback...`,
  );
  const { data: manualContext, error: manualError } = await supabase
.from('user_contexts')
.insert([
  {
user_id: userId,
context_name: 'Default',
description: 'Default identity context',
is_permanent: true,
visibility: 'public',
  },
])
.select()
.single();

  if (manualError) {
throw new Error(
  `Manual context creation also failed: ${manualError.message}`,
);
  } else {
console.log(
  `   ✅ Manual context creation successful: ${manualContext.id}`,
);
return { profile, context: manualContext };
  }
}
  }

  const defaultContext = contexts[0];
  console.log(
`   ✅ Default context created: ${defaultContext.id} (${defaultContext.context_name})`,
  );
  console.log(`   🎉 Full trigger chain completed successfully!`);

  return { profile, context: defaultContext };
} catch (err) {
  console.log(`   ❌ Trigger chain verification error: ${err.message}`);
  if (attempt < maxRetries) {
console.log(`   ⏳ Waiting ${delayMs}ms before retry...`);
await new Promise((resolve) => setTimeout(resolve, delayMs));
continue;
  } else {
throw new Error(
  `Trigger chain failed after ${maxRetries} attempts: ${err.message}`,
);
  }
}
  }
}

async function createDemoUsers() {
  // Check for force flag
  const forceRecreate = process.argv.includes('--force');

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

  console.log(
'🚀 TrueNamePath Demo User Creation with Trigger Chain Verification',
  );
  console.log(
'=====================================================================',
  );
  console.log(`🌐 Target: ${SUPABASE_URL}`);
  console.log(
`🔑 Service key: ${SERVICE_KEY ? '***' + SERVICE_KEY.slice(-4) : 'NOT SET'}`,
  );
  console.log(`🔄 Force recreate: ${forceRecreate ? 'YES' : 'NO'}`);
  console.log('');

  // Test database connectivity
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

  // Check existing users first
  console.log('');
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

  if (alreadyExist.length > 0 && !forceRecreate) {
console.log('⚠️  Found existing demo users:', alreadyExist.join(', '));
console.log(
  '   Use --force flag to recreate them, or delete manually first',
);
console.log('');
console.log('💡 Usage: node scripts/create-demo-users.js --force');
process.exit(0);
  }

  // Delete existing users if force flag is used
  if (alreadyExist.length > 0 && forceRecreate) {
console.log('🗑️  Force flag detected - deleting existing users...');
let deleteCount = 0;

for (const email of alreadyExist) {
  console.log(`   🗑️  Deleting user: ${email}`);

  try {
// Find user by email to get ID
const existingUser = existingUsers.users.find((u) => u.email === email);
if (existingUser) {
  const { error: deleteError } = await supabase.auth.admin.deleteUser(
existingUser.id,
  );
  if (deleteError) {
console.error(
  `   ❌ Failed to delete ${email}: ${deleteError.message}`,
);
  } else {
console.log(`   ✅ Deleted user: ${email}`);
deleteCount++;
  }
}
  } catch (err) {
console.error(`   ❌ Error deleting ${email}: ${err.message}`);
  }
}

console.log(`✅ Deleted ${deleteCount} existing users`);
console.log('');
  }

  // Create each demo user with comprehensive verification
  let successCount = 0;
  let errorCount = 0;

  for (const userData of DEMO_USERS) {
console.log('');
console.log(`👤 Creating user: ${userData.email}`);
console.log(`   Name: ${userData.user_metadata.name}`);
console.log(`   ID: ${userData.id}`);

try {
  // Step 1: Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
user_id: userData.id,
email: userData.email,
password: userData.password,
user_metadata: userData.user_metadata,
email_confirm: userData.email_confirm,
phone_confirm: userData.phone_confirm,
  });

  if (error) {
console.error(`   ❌ Auth user creation failed: ${error.message}`);
errorCount++;
continue;
  }

  console.log(`   ✅ Auth user created: ${data.user.id}`);

  // Step 2: Wait for trigger chain to complete
  try {
const triggerResult = await waitForTriggerChain(
  supabase,
  userData.id,
  userData.email,
);
console.log(`   ✅ Trigger chain verification successful`);
console.log(`   📋 Profile ID: ${triggerResult.profile.id}`);
console.log(`   📋 Default Context ID: ${triggerResult.context.id}`);
  } catch (triggerError) {
console.error(`   ❌ Trigger chain failed: ${triggerError.message}`);
errorCount++;
continue;
  }

  // Step 3: Test authentication
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
errorCount++;
continue;
  } else {
console.log(`   ✅ Authentication test successful`);
// Sign out immediately
await supabase.auth.signOut();
  }

  successCount++;
  console.log(`   🎉 User ${userData.email} fully operational!`);
} catch (err) {
  console.error(`   ❌ Unexpected error: ${err.message}`);
  console.error(`   Stack trace:`, err.stack);
  errorCount++;
}
  }

  // Summary with detailed verification
  console.log('');
  console.log('📊 Demo User Creation Summary');
  console.log('==============================');
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed to create: ${errorCount} users`);
  console.log(
`📈 Success rate: ${Math.round((successCount / DEMO_USERS.length) * 100)}%`,
  );
  console.log('');

  if (successCount === DEMO_USERS.length) {
console.log('🎉 All demo users created successfully!');
console.log('');
console.log('🔧 Verified Components:');
console.log('   • Auth user creation (Supabase Auth)');
console.log('   • Profile creation (on_auth_user_created trigger)');
console.log(
  '   • Default context creation (trigger_create_default_context trigger)',
);
console.log('   • Authentication functionality');
console.log('');
console.log('🔑 Demo Login Credentials:');
DEMO_USERS.forEach((user) => {
  console.log(
`   • ${user.email} / ${user.password} (${user.user_metadata.name})`,
  );
});
console.log('');
console.log('🌐 Test the application:');
console.log('   • Local: http://localhost:3000/auth/login');
console.log('   • Production: https://truename.vercel.app/auth/login');
console.log('');
console.log('✅ Demo users are ready for E2E testing and CI workflows!');
  } else {
console.log('⚠️  Some users failed to create. Check errors above.');
console.log('');
console.log('🔧 Troubleshooting Tips:');
console.log('   1. Check database triggers are properly installed');
console.log('   2. Verify service role key has sufficient permissions');
console.log('   3. Check Supabase connection and local instance status');
console.log('   4. Review trigger function logs in Supabase dashboard');
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
