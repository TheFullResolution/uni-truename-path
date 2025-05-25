import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

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

if (error) throw error;
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
// Delete in order due to foreign key constraints
await supabase.from('names').delete().neq('id', '00000000-0000-0000-0000-000000000000');
await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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