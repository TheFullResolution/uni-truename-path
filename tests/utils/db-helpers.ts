/* eslint-env node */
import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment
const supabaseUrl = process.env.SUPABASE_URL!;
// Use service role key for tests to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface TestProfile {
  id?: string;
  email: string;
  created_at?: string;
}

export interface TestName {
  id?: string;
  profile_id: string;
  name_text: string;
  type: 'legal' | 'preferred' | 'nickname' | 'alias';
  visibility?: 'public' | 'internal' | 'restricted' | 'private';
  verified?: boolean;
  source?: string;
}

export class DatabaseTestHelper {
  /**
   * Create a test profile
   */
  static async createProfile(email: string): Promise<TestProfile> {
const { data, error } = await supabase
  .from('profiles')
  .insert({ email })
  .select()
  .single();

if (error) {
  console.error('Error creating profile:', error);
  throw error;
}
if (!data) {
  throw new Error('Profile created but no data returned - possible RLS issue');
}
return data;
  }

  /**
   * Create a test name for a profile
   */
  static async createName(profileId: string, nameData: Omit<TestName, 'id' | 'profile_id'>): Promise<TestName> {
const { data, error } = await supabase
  .from('names')
  .insert({ 
profile_id: profileId,
...nameData 
  })
  .select()
  .single();

if (error) throw error;
return data;
  }

  /**
   * Clean up all test data
   */
  static async cleanup(): Promise<void> {
// Delete test data by email pattern - only delete test emails
const testEmailPattern = ['test-', '@test.', '@example.test'];

// Get all test profiles first
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, email')
  .or(testEmailPattern.map(pattern => `email.like.%${pattern}%`).join(','));

if (profiles && profiles.length > 0) {
  const profileIds = profiles.map(p => p.id);
  
  // Delete in reverse order of dependencies
  await supabase.from('name_disclosure_log').delete().in('profile_id', profileIds);
  await supabase.from('consents').delete().in('profile_id', profileIds);
  await supabase.from('names').delete().in('profile_id', profileIds);
  await supabase.from('profiles').delete().in('id', profileIds);
}
  }

  /**
   * Get profile by email
   */
  static async getProfileByEmail(email: string): Promise<TestProfile | null> {
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', email)
  .single();

if (error && error.code !== 'PGRST116') throw error;
return data;
  }

  /**
   * Get names for a profile
   */
  static async getNamesForProfile(profileId: string): Promise<TestName[]> {
const { data, error } = await supabase
  .from('names')
  .select('*')
  .eq('profile_id', profileId);

if (error) throw error;
return data || [];
  }
}
