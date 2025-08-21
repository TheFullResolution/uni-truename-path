#!/usr/bin/env node

/**
 * E2E Test Database State Debug Helper
 *
 * This script helps debug E2E test failures by showing the current state
 * of the database for demo users. It can be called from within E2E tests
 * or run standalone to understand what data is available.
 */

import { createClient } from '@supabase/supabase-js';

// Configuration from environment variables
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Demo user specifications
const DEMO_USERS = [
  {
id: '54c00e81-cda9-4251-9456-7778df91b988',
email: 'jj@truename.test',
persona: 'JJ',
  },
  {
id: '809d0224-81f1-48a0-9405-2258de21ea60',
email: 'liwei@truename.test',
persona: 'LIWEI',
  },
  {
id: '257113c8-7a62-4758-9b1b-7992dd8aca1e',
email: 'alex@truename.test',
persona: 'ALEX',
  },
];

/**
 * Debug database state for E2E testing
 */
async function debugDatabaseState(specificUserId = null) {
  console.log('🔍 E2E Test Database State Debug');
  console.log('================================');
  console.log(`🌐 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Service key: ${SERVICE_KEY ? 'AVAILABLE' : 'MISSING'}`);
  console.log(`👤 Focus user: ${specificUserId || 'ALL DEMO USERS'}`);
  console.log('');

  if (!SUPABASE_URL || !SERVICE_KEY) {
console.error('❌ Missing required environment variables');
return { success: false, error: 'Missing environment variables' };
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
auth: {
  autoRefreshToken: false,
  persistSession: false,
},
  });

  try {
let usersToDebug = DEMO_USERS;
if (specificUserId) {
  usersToDebug = DEMO_USERS.filter(
(user) =>
  user.id === specificUserId ||
  user.email === specificUserId ||
  user.persona === specificUserId.toUpperCase(),
  );
}

const debugResults = {
  timestamp: new Date().toISOString(),
  totalUsers: usersToDebug.length,
  users: {},
  summary: {
authUsers: 0,
profiles: 0,
contexts: 0,
names: 0,
  },
};

for (const user of usersToDebug) {
  console.log(`👤 Debugging ${user.persona} (${user.email})`);
  console.log('='.repeat(50));

  const userData = {
id: user.id,
email: user.email,
persona: user.persona,
authUser: null,
profile: null,
contexts: [],
names: [],
errors: [],
  };

  try {
// Check 1: Auth user
console.log('🔐 Auth user status...');
const { data: authUsers, error: authError } =
  await supabase.auth.admin.listUsers();

if (authError) {
  console.log(`❌ Auth query error: ${authError.message}`);
  userData.errors.push(`Auth error: ${authError.message}`);
} else {
  const authUser = authUsers.users.find((u) => u.email === user.email);
  if (authUser) {
userData.authUser = {
  id: authUser.id,
  email: authUser.email,
  confirmed_at: authUser.email_confirmed_at,
  created_at: authUser.created_at,
};
debugResults.summary.authUsers++;
console.log(`✅ Auth user found: ${authUser.id}`);
  } else {
console.log('❌ Auth user NOT FOUND');
userData.errors.push('Auth user missing');
  }
}

// Check 2: Profile
console.log('👤 Profile status...');
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

if (profileError) {
  console.log(`❌ Profile error: ${profileError.message}`);
  userData.errors.push(`Profile error: ${profileError.message}`);
} else if (profile) {
  userData.profile = profile;
  debugResults.summary.profiles++;
  console.log(`✅ Profile found: ${profile.id} (${profile.email})`);
} else {
  console.log('❌ Profile NOT FOUND');
  userData.errors.push('Profile missing');
}

// Check 3: Contexts
console.log('📋 Contexts status...');
const { data: contexts, error: contextError } = await supabase
  .from('user_contexts')
  .select('*')
  .eq('user_id', user.id)
  .order('is_permanent', { ascending: false });

if (contextError) {
  console.log(`❌ Context error: ${contextError.message}`);
  userData.errors.push(`Context error: ${contextError.message}`);
} else if (contexts && contexts.length > 0) {
  userData.contexts = contexts;
  debugResults.summary.contexts += contexts.length;
  console.log(`✅ Contexts found: ${contexts.length}`);
  contexts.forEach((ctx, idx) => {
console.log(
  `   ${idx + 1}. ${ctx.context_name} (${ctx.is_permanent ? 'DEFAULT' : 'CUSTOM'})`,
);
  });
} else {
  console.log('❌ NO CONTEXTS FOUND');
  userData.errors.push('No contexts found');
}

// Check 4: Names
console.log('📝 Names status...');
const { data: names, error: namesError } = await supabase
  .from('names')
  .select('*')
  .eq('user_id', user.id)
  .order('is_preferred', { ascending: false });

if (namesError) {
  console.log(`❌ Names error: ${namesError.message}`);
  userData.errors.push(`Names error: ${namesError.message}`);
} else if (names && names.length > 0) {
  userData.names = names;
  debugResults.summary.names += names.length;
  console.log(`✅ Names found: ${names.length}`);
  names.forEach((name, idx) => {
const displayName =
  name.display_name ||
  name.first_name ||
  name.full_name ||
  'unnamed';
const category = name.name_category || 'unknown';
console.log(
  `   ${idx + 1}. ${displayName} (${category}, ${name.is_preferred ? 'PREFERRED' : 'not preferred'})`,
);
  });
} else {
  console.log('⚠️  NO NAMES FOUND');
  userData.errors.push('No names found');
}

// Check 5: Context assignments
console.log('🔗 Context assignments status...');
const { data: assignments, error: assignmentsError } = await supabase
  .from('context_name_assignments')
  .select(
`
*,
user_contexts!inner(context_name),
names!inner(*)
  `,
  )
  .eq('user_id', user.id);

if (assignmentsError) {
  console.log(`❌ Assignments error: ${assignmentsError.message}`);
} else if (assignments && assignments.length > 0) {
  console.log(`✅ Assignments found: ${assignments.length}`);
  assignments.forEach((assignment, idx) => {
console.log(
  `   ${idx + 1}. "${assignment.names.display_name}" → "${assignment.user_contexts.context_name}"`,
);
  });
} else {
  console.log('⚠️  NO ASSIGNMENTS FOUND (this may be normal)');
}
  } catch (err) {
console.log(`❌ Unexpected error: ${err.message}`);
userData.errors.push(`Unexpected error: ${err.message}`);
  }

  debugResults.users[user.persona] = userData;
  console.log('');
}

// Overall summary
console.log('📊 Overall Database State');
console.log('='.repeat(30));
console.log(
  `Auth Users: ${debugResults.summary.authUsers}/${usersToDebug.length}`,
);
console.log(
  `Profiles: ${debugResults.summary.profiles}/${usersToDebug.length}`,
);
console.log(`Total Contexts: ${debugResults.summary.contexts}`);
console.log(`Total Names: ${debugResults.summary.names}`);
console.log('');

// Error summary
const totalErrors = Object.values(debugResults.users).reduce(
  (sum, user) => sum + user.errors.length,
  0,
);

if (totalErrors > 0) {
  console.log('❌ Issues found:');
  Object.entries(debugResults.users).forEach(([persona, user]) => {
if (user.errors.length > 0) {
  console.log(`   ${persona}: ${user.errors.join(', ')}`);
}
  });
  console.log('');
} else {
  console.log('✅ No issues detected in database state');
  console.log('');
}

return { success: true, data: debugResults };
  } catch (error) {
console.error('❌ Debug script failed:', error.message);
return { success: false, error: error.message };
  }
}

// Export for programmatic use
export { debugDatabaseState, DEMO_USERS };

// CLI usage
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  const specificUser = process.argv[2]; // Optional user filter
  debugDatabaseState(specificUser)
.then((result) => {
  if (!result.success) {
console.error('Debug failed:', result.error);
process.exit(1);
  }
})
.catch((error) => {
  console.error('Debug script error:', error.message);
  process.exit(1);
});
}
