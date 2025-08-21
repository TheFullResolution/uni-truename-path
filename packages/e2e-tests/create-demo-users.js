// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: 'packages/e2e-tests/.env.local' });

import { createClient } from '@supabase/supabase-js';

// Use environment variables with local Supabase as default
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment configuration:');
console.log('Supabase URL:', supabaseUrl);
console.log('Environment: LOCAL (from .env.local)');
console.log(
  'Service role key:',
  supabaseServiceKey ? '✅ Loaded from environment' : '❌ Missing',
);

if (!supabaseServiceKey) {
  console.log('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
autoRefreshToken: false,
persistSession: false,
  },
});

async function createDemoUsers() {
  const demoUsers = [
{
  id: '54c00e81-cda9-4251-9456-7778df91b988', // Match migration 021
  email: 'jj@truename.test',
  password: 'demo123!',
  user_metadata: { name: 'Jędrzej Lewandowski' },
  email_confirm: true,
},
{
  id: '809d0224-81f1-48a0-9405-2258de21ea60', // Match migration 021
  email: 'liwei@truename.test',
  password: 'demo123!',
  user_metadata: { name: 'Li Wei' },
  email_confirm: true,
},
{
  id: '257113c8-7a62-4758-9b1b-7992dd8aca1e', // Match migration 021
  email: 'alex@truename.test',
  password: 'demo123!',
  user_metadata: { name: 'Alex Smith' },
  email_confirm: true,
},
  ];

  console.log('Creating demo users...');

  for (const userData of demoUsers) {
console.log(`Creating user: ${userData.email} with ID: ${userData.id}`);
const { data, error } = await supabase.auth.admin.createUser(userData);

if (error) {
  console.error(`Error creating ${userData.email}:`, error.message);
} else {
  console.log(
`Successfully created ${userData.email} with ID: ${data.user.id}`,
  );
}
  }

  console.log('Demo user creation completed!');
}

createDemoUsers().catch(console.error);
