import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { supabase } from '../../utils/db-helpers';

test.describe('Context Engine - resolve_name()', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should resolve names based on audience context', async () => {
// Create JJ persona
const jjProfile = await DatabaseTestHelper.createProfile('jj@example.com');

// Legal name
await DatabaseTestHelper.createName(jjProfile.id!, {
  name_text: 'Jędrzej Lewandowski',
  type: 'legal',
  visibility: 'restricted',
  source: 'legal_documents'
});

// Preferred nickname
await DatabaseTestHelper.createName(jjProfile.id!, {
  name_text: 'JJ',
  type: 'preferred',
  visibility: 'public',
  source: 'personal_preference'
});

// Professional alias
await DatabaseTestHelper.createName(jjProfile.id!, {
  name_text: 'J. Lewandowski',
  type: 'alias',
  visibility: 'public',
  source: 'professional'
});

// Create consents
await supabase.from('consents').insert([
  {
profile_id: jjProfile.id,
audience: 'hr_department',
purpose: 'employment',
access_level: 'full',
active: true
  },
  {
profile_id: jjProfile.id,
audience: 'slack_internal',
purpose: 'communication',
access_level: 'preferred_only',
active: true
  },
  {
profile_id: jjProfile.id,
audience: 'github_public',
purpose: 'code_contributions',
access_level: 'alias_only',
active: true
  }
]);

// Test HR context - should get legal name
const { data: hrName } = await supabase.rpc('resolve_name', {
  p_profile: jjProfile.id,
  p_audience: 'hr_department',
  p_purpose: 'employment'
});
expect(hrName).toBe('Jędrzej Lewandowski');

// Test Slack context - should get preferred name
const { data: slackName } = await supabase.rpc('resolve_name', {
  p_profile: jjProfile.id,
  p_audience: 'slack_internal',
  p_purpose: 'communication'
});
expect(slackName).toBe('JJ');

// Test GitHub context - should get alias
const { data: githubName } = await supabase.rpc('resolve_name', {
  p_profile: jjProfile.id,
  p_audience: 'github_public',
  p_purpose: 'code_contributions'
});
expect(githubName).toBe('J. Lewandowski');

// Test no consent - should get Anonymous User
const { data: noConsentName } = await supabase.rpc('resolve_name', {
  p_profile: jjProfile.id,
  p_audience: 'unknown_service',
  p_purpose: 'unknown'
});
expect(noConsentName).toBe('Anonymous User');
  });

  test('should create audit trail for name disclosures', async () => {
const profile = await DatabaseTestHelper.createProfile('audit-test@example.com');

await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Test User',
  type: 'preferred',
  visibility: 'public'
});

await supabase.from('consents').insert({
  profile_id: profile.id,
  audience: 'test_audience',
  purpose: 'testing',
  access_level: 'full',
  active: true
});

// Get count before disclosure
const { count: beforeCount } = await supabase
  .from('name_disclosure_log')
  .select('*', { count: 'exact', head: true })
  .eq('profile_id', profile.id);

// Call resolve_name to trigger disclosure
await supabase.rpc('resolve_name', {
  p_profile: profile.id,
  p_audience: 'test_audience',
  p_purpose: 'testing'
});

// Check audit log was created
const { data: logs, count: afterCount } = await supabase
  .from('name_disclosure_log')
  .select('*', { count: 'exact' })
  .eq('profile_id', profile.id)
  .eq('audience', 'test_audience');

expect(afterCount).toBe((beforeCount || 0) + 1);
expect(logs?.[0]).toMatchObject({
  profile_id: profile.id,
  audience: 'test_audience',
  purpose: 'testing',
  name_disclosed: 'Test User'
});
  });

  test('should handle multi-language names correctly', async () => {
// Create Li Wei persona
const liWeiProfile = await DatabaseTestHelper.createProfile('liwei@example.com');

// Chinese legal name
await DatabaseTestHelper.createName(liWeiProfile.id!, {
  name_text: '李伟',
  type: 'legal',
  visibility: 'restricted',
  source: 'legal_documents'
});

// Western adaptation
await DatabaseTestHelper.createName(liWeiProfile.id!, {
  name_text: 'Wei Li',
  type: 'preferred',
  visibility: 'public',
  source: 'western_adaptation'
});

// Nickname
await DatabaseTestHelper.createName(liWeiProfile.id!, {
  name_text: 'Wei',
  type: 'nickname',
  visibility: 'internal',
  source: 'colleagues'
});

// Create consents
await supabase.from('consents').insert([
  {
profile_id: liWeiProfile.id,
audience: 'hr_department',
purpose: 'employment',
access_level: 'full',
active: true
  },
  {
profile_id: liWeiProfile.id,
audience: 'slack_internal',
purpose: 'communication',
access_level: 'preferred_only',
active: true
  }
]);

// Test HR context - should get Chinese legal name
const { data: hrName } = await supabase.rpc('resolve_name', {
  p_profile: liWeiProfile.id,
  p_audience: 'hr_department',
  p_purpose: 'employment'
});
expect(hrName).toBe('李伟');

// Test Slack context - should get Western adaptation
const { data: slackName } = await supabase.rpc('resolve_name', {
  p_profile: liWeiProfile.id,
  p_audience: 'slack_internal',
  p_purpose: 'communication'
});
expect(slackName).toBe('Wei Li');
  });

  test('should respect visibility levels', async () => {
const profile = await DatabaseTestHelper.createProfile('visibility@example.com');

// Create names with different visibility levels
await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Private Name',
  type: 'legal',
  visibility: 'private',
  source: 'confidential'
});

await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Public Name',
  type: 'preferred',
  visibility: 'public',
  source: 'public_profile'
});

// Even with full consent, private names shouldn't be disclosed to non-HR
await supabase.from('consents').insert({
  profile_id: profile.id,
  audience: 'general_public',
  purpose: 'display',
  access_level: 'full',
  active: true
});

const { data: publicName } = await supabase.rpc('resolve_name', {
  p_profile: profile.id,
  p_audience: 'general_public',
  p_purpose: 'display'
});

expect(publicName).toBe('Public Name');
expect(publicName).not.toBe('Private Name');
  });
});