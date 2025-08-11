import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { supabase } from '../../utils/db-helpers';

test.describe('Context Engine - Enhanced resolve_name() with User-Defined Contexts', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should resolve names using 3-layer priority system (consent > context > preferred)', async () => {
// Create JJ persona with user-defined contexts using the new helper
const uniqueId = Math.random().toString(36).substring(7);
const jjData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-jj-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Jędrzej Lewandowski',
name_type: 'LEGAL',
is_preferred: false,
  },
  { name_text: 'JJ', name_type: 'PREFERRED', is_preferred: true },
  {
name_text: 'J. Lewandowski',
name_type: 'ALIAS',
is_preferred: false,
  },
],
contexts: [
  {
context_name: 'Work Colleagues',
description: 'Professional workplace context',
assigned_name: 'Jędrzej Lewandowski',
  },
  {
context_name: 'Gaming Friends',
description: 'Casual gaming and social interactions',
assigned_name: 'JJ',
  },
  {
context_name: 'Open Source',
description: 'Technical communities and code contributions',
assigned_name: 'J. Lewandowski',
  },
],
  },
);

// Create another user to test consent-based resolution
const requesterData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-requester-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Test Requester',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
contexts: [],
  },
);

// PRIORITY 1: Test consent-based resolution (highest priority)
// Create consent for requester to access JJ's "Work Colleagues" context
const workContext = jjData.contexts.find(
  (c) => c.context_name === 'Work Colleagues',
)!;
await DatabaseTestHelper.createConsent({
  granter_user_id: jjData.profile.id!,
  requester_user_id: requesterData.profile.id!,
  context_id: workContext.id!,
  status: 'GRANTED',
});

const { data: consentName } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_requester_user_id: requesterData.profile.id,
  p_context_name: null, // Context name ignored when consent exists
});
expect(consentName).toBe('Jędrzej Lewandowski'); // Should get name assigned to consented context

// PRIORITY 2: Test context-specific resolution (medium priority)
const { data: workName } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'Work Colleagues',
});
expect(workName).toBe('Jędrzej Lewandowski');

const { data: gamingName } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'Gaming Friends',
});
expect(gamingName).toBe('JJ');

const { data: openSourceName } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'Open Source',
});
expect(openSourceName).toBe('J. Lewandowski');

// PRIORITY 3: Test preferred name fallback (lowest priority)
const { data: fallbackName } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_requester_user_id: null,
  p_context_name: null,
});
expect(fallbackName).toBe('JJ'); // Should get preferred name

// Test context not found fallback
const { data: contextNotFoundName } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'NonExistent Context',
});
expect(contextNotFoundName).toBe('JJ'); // Should fall back to preferred name
  });

  test('should create comprehensive audit trail for name disclosures', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const userData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-audit-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Test User',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
contexts: [
  {
context_name: 'Testing Context',
description: 'Context for audit testing',
assigned_name: 'Test User',
  },
],
  },
);

// Get audit entries before disclosure
const { data: beforeLogs } = await supabase
  .from('audit_log_entries')
  .select('*')
  .eq('target_user_id', userData.profile.id)
  .eq('action', 'NAME_DISCLOSED');

// Call resolve_name to trigger disclosure (preferred name fallback)
await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_requester_user_id: null,
  p_context_name: null,
});

// Check audit log was created
const { data: logs } = await supabase
  .from('audit_log_entries')
  .select('*')
  .eq('target_user_id', userData.profile.id)
  .eq('action', 'NAME_DISCLOSED')
  .order('accessed_at', { ascending: false })
  .limit(1);

expect(logs?.length).toBe((beforeLogs?.length || 0) + 1);
expect(logs?.[0]).toMatchObject({
  target_user_id: userData.profile.id,
  action: 'NAME_DISCLOSED',
  requester_user_id: null,
  context_id: null, // No specific context used (fallback)
});

// Test context-specific resolution audit
await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'Testing Context',
});

// Check context-specific audit entry
const { data: contextLogs } = await supabase
  .from('audit_log_entries')
  .select('*, user_contexts!inner(context_name)')
  .eq('target_user_id', userData.profile.id)
  .eq('action', 'NAME_DISCLOSED')
  .not('context_id', 'is', null)
  .order('accessed_at', { ascending: false })
  .limit(1);

expect(contextLogs?.[0]?.user_contexts?.context_name).toBe(
  'Testing Context',
);
  });

  test('should handle multi-language names with user-defined contexts', async () => {
// Create Li Wei persona with realistic user-defined contexts
const uniqueId = Math.random().toString(36).substring(7);
const liWeiData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-liwei-${uniqueId}@example.test`,
  {
names: [
  { name_text: '李伟', name_type: 'LEGAL', is_preferred: false },
  { name_text: 'Li Wei', name_type: 'PREFERRED', is_preferred: true },
  { name_text: 'Wei', name_type: 'NICKNAME', is_preferred: false },
],
contexts: [
  {
context_name: 'Professional Network',
description: 'Business and HR contexts',
assigned_name: '李伟',
  },
  {
context_name: 'Close Friends',
description: 'Personal social interactions',
assigned_name: 'Wei',
  },
  {
context_name: 'Family & Cultural',
description: 'Family and cultural community',
assigned_name: '李伟',
  },
],
  },
);

// Test Professional Network context - should get Chinese legal name
const { data: professionalName } = await supabase.rpc('resolve_name', {
  p_target_user_id: liWeiData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'Professional Network',
});
expect(professionalName).toBe('李伟');

// Test Close Friends context - should get nickname
const { data: friendsName } = await supabase.rpc('resolve_name', {
  p_target_user_id: liWeiData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'Close Friends',
});
expect(friendsName).toBe('Wei');

// Test Family & Cultural context - should get Chinese name
const { data: culturalName } = await supabase.rpc('resolve_name', {
  p_target_user_id: liWeiData.profile.id,
  p_requester_user_id: null,
  p_context_name: 'Family & Cultural',
});
expect(culturalName).toBe('李伟');

// Test fallback - should get preferred name (Western adaptation)
const { data: fallbackName } = await supabase.rpc('resolve_name', {
  p_target_user_id: liWeiData.profile.id,
  p_requester_user_id: null,
  p_context_name: null,
});
expect(fallbackName).toBe('Li Wei');
  });

  test('should test consent lifecycle (request, grant, revoke)', async () => {
const uniqueId = Math.random().toString(36).substring(7);

// Create two users for consent testing
const granterData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-granter-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Granter User',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
contexts: [
  {
context_name: 'Professional Info',
description: 'Work-related information',
assigned_name: 'Granter User',
  },
],
  },
);

const requesterData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-requester-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Requester User',
name_type: 'PREFERRED',
is_preferred: true,
  },
],
contexts: [],
  },
);

// Test request consent function
const { data: consentId } = await supabase.rpc('request_consent', {
  p_granter_user_id: granterData.profile.id,
  p_requester_user_id: requesterData.profile.id,
  p_context_name: 'Professional Info',
});
expect(consentId).toBeTruthy();

// Verify consent is pending
const { data: pendingConsent } = await supabase
  .from('consents')
  .select('*')
  .eq('id', consentId)
  .single();
expect(pendingConsent?.status).toBe('PENDING');

// Test grant consent function
const { data: grantResult } = await supabase.rpc('grant_consent', {
  p_granter_user_id: granterData.profile.id,
  p_requester_user_id: requesterData.profile.id,
});
expect(grantResult).toBe(true);

// Verify consent is granted
const { data: grantedConsent } = await supabase
  .from('consents')
  .select('*')
  .eq('id', consentId)
  .single();
expect(grantedConsent?.status).toBe('GRANTED');

// Test name resolution with granted consent
const { data: consentName } = await supabase.rpc('resolve_name', {
  p_target_user_id: granterData.profile.id,
  p_requester_user_id: requesterData.profile.id,
});
expect(consentName).toBe('Granter User');

// Test revoke consent function
const { data: revokeResult } = await supabase.rpc('revoke_consent', {
  p_granter_user_id: granterData.profile.id,
  p_requester_user_id: requesterData.profile.id,
});
expect(revokeResult).toBe(true);

// Verify consent is revoked and name resolution falls back to preferred
const { data: revokedConsent } = await supabase
  .from('consents')
  .select('*')
  .eq('id', consentId)
  .single();
expect(revokedConsent?.status).toBe('REVOKED');

// After revocation, should fall back to preferred name
const { data: fallbackName } = await supabase.rpc('resolve_name', {
  p_target_user_id: granterData.profile.id,
  p_requester_user_id: requesterData.profile.id,
});
expect(fallbackName).toBe('Granter User'); // Falls back to preferred
  });
});
