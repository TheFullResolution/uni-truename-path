import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../types/generated';

export function createClient() {
  // Validate environment variables at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!supabaseAnonKey) {
throw new Error(
  'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable',
);
  }

  try {
return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  } catch (error) {
console.error('Failed to create Supabase browser client:', error);
throw new Error('Failed to initialize Supabase client');
  }
}
