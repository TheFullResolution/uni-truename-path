/* eslint-env node */
import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment (aligned with SSR patterns)
// For tests, we prefer local Supabase if available, otherwise use NEXT_PUBLIC_ vars
const supabaseUrl =
  process.env.SUPABASE_URL || // Legacy for local testing
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'http://127.0.0.1:54321'; // Default local Supabase

// Use service role key for tests to bypass RLS, fallback to anon key
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface TestProfile {
  id?: string;
  email: string;
  created_at?: string;
}

export interface TestName {
  id?: string;
  user_id: string; // Updated from profile_id to match new schema
  name_text: string; // Correct column name is name_text
  name_type: 'LEGAL' | 'PREFERRED' | 'NICKNAME' | 'ALIAS'; // Updated to use ENUM values
  is_preferred?: boolean; // New field for preferred name tracking
  verified?: boolean;
  source?: string;
}

export interface TestUserContext {
  id?: string;
  user_id: string;
  context_name: string;
  description?: string;
  created_at?: string;
}

export interface TestContextNameAssignment {
  id?: string;
  user_id: string;
  context_id: string;
  name_id: string;
}

export interface TestConsent {
  id?: string;
  granter_user_id: string;
  requester_user_id: string;
  context_id: string;
  status: 'PENDING' | 'GRANTED' | 'REVOKED' | 'EXPIRED';
  granted_at?: string;
  revoked_at?: string;
  expires_at?: string;
}

export class DatabaseTestHelper {
  /**
   * Create a test profile
   */
  static async createProfile(email: string): Promise<TestProfile> {
// First check if profile already exists
const existing = await this.getProfileByEmail(email);
if (existing) {
  return existing;
}

const { data, error } = await supabase
  .from('profiles')
  .insert({ email })
  .select()
  .single();

if (error) {
  // If profile already exists, try to get it instead of failing
  if (error.code === '23505') {
const existingProfile = await this.getProfileByEmail(email);
if (existingProfile) {
  return existingProfile;
}
  }
  console.error('Error creating profile:', error);
  throw error;
}
if (!data) {
  throw new Error(
'Profile created but no data returned - possible RLS issue',
  );
}
return data;
  }

  /**
   * Create a test name for a user
   */
  static async createName(
userId: string,
nameData: Omit<TestName, 'id' | 'user_id'>,
  ): Promise<TestName> {
console.log('📝 Creating name:', nameData.name_text, 'for user:', userId);

const { data, error } = await supabase
  .from('names')
  .insert({
user_id: userId,
...nameData,
  })
  .select()
  .single();

if (error) {
  console.error('❌ Name creation failed:', error);
  throw error;
}

console.log('✅ Name created:', data.name_text);
return data;
  }

  /**
   * Create a user context
   */
  static async createUserContext(
userId: string,
contextData: Omit<TestUserContext, 'id' | 'user_id'>,
  ): Promise<TestUserContext> {
const { data, error } = await supabase
  .from('user_contexts')
  .insert({
user_id: userId,
...contextData,
  })
  .select()
  .single();

if (error) throw error;
return data;
  }

  /**
   * Create a context name assignment
   */
  static async createContextNameAssignment(
assignmentData: Omit<TestContextNameAssignment, 'id'>,
  ): Promise<TestContextNameAssignment> {
const { data, error } = await supabase
  .from('context_name_assignments')
  .insert(assignmentData)
  .select()
  .single();

if (error) throw error;
return data;
  }

  /**
   * Create a consent record
   */
  static async createConsent(
consentData: Omit<TestConsent, 'id'>,
  ): Promise<TestConsent> {
const { data, error } = await supabase
  .from('consents')
  .insert(consentData)
  .select()
  .single();

if (error) throw error;
return data;
  }

  /**
   * Clean up specific user data
   */
  static async cleanupUser(userId: string): Promise<void> {
// Delete data for specific user ID
await supabase
  .from('audit_log_entries')
  .delete()
  .eq('target_user_id', userId);
await supabase
  .from('consents')
  .delete()
  .or(`granter_user_id.eq.${userId},requester_user_id.eq.${userId}`);
await supabase
  .from('context_name_assignments')
  .delete()
  .eq('user_id', userId);
await supabase.from('user_contexts').delete().eq('user_id', userId);
await supabase.from('names').delete().eq('user_id', userId);
await supabase.from('profiles').delete().eq('id', userId);

// Also cleanup from auth.users if using admin API
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
const adminClient = createClient(supabaseUrl, serviceRoleKey);
await adminClient.auth.admin.deleteUser(userId);
  }
} catch (error) {
  // Ignore auth deletion errors - user might not exist
  console.warn('Auth user deletion warning:', error);
}
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
  .or(
testEmailPattern.map((pattern) => `email.like.%${pattern}%`).join(','),
  );

if (profiles && profiles.length > 0) {
  const profileIds = profiles.map((p) => p.id);

  // Delete in reverse order of dependencies - updated for Step 2 schema
  await supabase
.from('audit_log_entries')
.delete()
.in('target_user_id', profileIds);
  await supabase
.from('consents')
.delete()
.or(
  `granter_user_id.in.(${profileIds.join(',')}),requester_user_id.in.(${profileIds.join(',')})`,
);
  await supabase
.from('context_name_assignments')
.delete()
.in('user_id', profileIds);
  await supabase.from('user_contexts').delete().in('user_id', profileIds);
  await supabase.from('names').delete().in('user_id', profileIds);
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
   * Get names for a user
   */
  static async getNamesForUser(userId: string): Promise<TestName[]> {
const { data, error } = await supabase
  .from('names')
  .select('*')
  .eq('user_id', userId);

if (error) throw error;
return data || [];
  }

  /**
   * Get user contexts for a user
   */
  static async getUserContexts(userId: string): Promise<TestUserContext[]> {
const { data, error } = await supabase
  .from('user_contexts')
  .select('*')
  .eq('user_id', userId);

if (error) throw error;
return data || [];
  }

  /**
   * Get context name assignments for a user
   */
  static async getContextNameAssignments(
userId: string,
  ): Promise<TestContextNameAssignment[]> {
const { data, error } = await supabase
  .from('context_name_assignments')
  .select('*')
  .eq('user_id', userId);

if (error) throw error;
return data || [];
  }

  /**
   * Create a complete persona with names, contexts, and assignments (helper for testing)
   */
  static async createPersonaWithContexts(
email: string,
persona: {
  names: Array<{
name_text: string;
name_type: 'LEGAL' | 'PREFERRED' | 'NICKNAME' | 'ALIAS';
is_preferred?: boolean;
  }>;
  contexts: Array<{
context_name: string;
description: string;
assigned_name?: string;
  }>;
},
  ): Promise<{
profile: TestProfile;
names: TestName[];
contexts: TestUserContext[];
assignments: TestContextNameAssignment[];
  }> {
// Create profile
const profile = await this.createProfile(email);

// Create names
const names: TestName[] = [];
for (const nameData of persona.names) {
  const name = await this.createName(profile.id!, {
name_text: nameData.name_text,
name_type: nameData.name_type,
is_preferred: nameData.is_preferred || false,
verified: true,
source: 'test_data',
  });
  names.push(name);
}

// Create contexts
const contexts: TestUserContext[] = [];
const assignments: TestContextNameAssignment[] = [];

for (const contextData of persona.contexts) {
  const context = await this.createUserContext(profile.id!, {
context_name: contextData.context_name,
description: contextData.description,
  });
  contexts.push(context);

  // Create assignment if specified
  if (contextData.assigned_name) {
const assignedName = names.find(
  (n) => n.name_text === contextData.assigned_name,
);
if (assignedName) {
  const assignment = await this.createContextNameAssignment({
user_id: profile.id!,
context_id: context.id!,
name_id: assignedName.id!,
  });
  assignments.push(assignment);
}
  }
}

return { profile, names, contexts, assignments };
  }

  /**
   * Get all names for a profile
   */
  static async getNamesForProfile(userId: string): Promise<TestName[]> {
const { data, error } = await supabase
  .from('names')
  .select('*')
  .eq('user_id', userId);

if (error) throw error;
return data || [];
  }

  /**
   * Get audit log entries for a user
   */
  static async getAuditLogEntries(targetUserId: string): Promise<any[]> {
const { data, error } = await supabase
  .from('audit_log_entries')
  .select('*')
  .eq('target_user_id', targetUserId)
  .order('created_at', { ascending: false });

if (error) throw error;
return data || [];
  }

  /**
   * Helper methods with simplified names for API tests
   */
  static async createTestProfile(uniqueId: string): Promise<any> {
return await this.createProfile(`test-${uniqueId}@example.com`);
  }

  static async createTestName(
userId: string,
nameText: string,
nameType: 'LEGAL' | 'PREFERRED' | 'NICKNAME' | 'ALIAS',
  ): Promise<any> {
return await this.createName(userId, {
  name_text: nameText,
  name_type: nameType,
  is_preferred: nameType === 'PREFERRED',
  verified: true,
  source: 'test_data',
});
  }

  static async createTestContext(
userId: string,
contextName: string,
description: string,
  ): Promise<any> {
return await this.createUserContext(userId, {
  context_name: contextName,
  description: description,
});
  }

  static async createTestContextAssignment(
userId: string,
contextId: string,
nameId: string,
  ): Promise<any> {
return await this.createContextNameAssignment({
  user_id: userId,
  context_id: contextId,
  name_id: nameId,
});
  }

  static async createTestConsent(
granterUserId: string,
requesterUserId: string,
contextId: string,
granted: boolean = true,
  ): Promise<any> {
return await this.createConsent({
  granter_user_id: granterUserId,
  requester_user_id: requesterUserId,
  context_id: contextId,
  status: granted ? 'GRANTED' : 'PENDING',
  granted_at: granted ? new Date().toISOString() : undefined,
});
  }
}
