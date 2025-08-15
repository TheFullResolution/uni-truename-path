import { expect, test } from '@playwright/test';
import { DatabaseTestHelper, supabase } from '../../utils/db-helpers';

test.describe('Multi-Name System Integration - Step 2 Architecture', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should support complex name scenarios with user-defined contexts', async () => {
// Create a profile with multiple name changes over time using new schema
const uniqueId = Math.random().toString(36).substring(7);
const userData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-complex-${uniqueId}@example.test`,
  {
names: [
  { name_text: 'Jane Smith', name_type: 'LEGAL', is_preferred: false },
  { name_text: 'Jane Doe', name_type: 'PREFERRED', is_preferred: true },
  { name_text: 'Janie', name_type: 'NICKNAME', is_preferred: false },
],
contexts: [
  {
context_name: 'Legal Documents',
description: 'Government and legal contexts',
assigned_name: 'Jane Smith',
  },
  {
context_name: 'Professional Work',
description: 'Work colleagues and business',
assigned_name: 'Jane Doe',
  },
  {
context_name: 'Close Friends',
description: 'Personal friendships',
assigned_name: 'Janie',
  },
],
  },
);

// Verify all names are stored
const names = await DatabaseTestHelper.getNamesForUser(
  userData.profile.id!,
);
expect(names).toHaveLength(3);

// Verify contexts resolve to different names
const contexts = await DatabaseTestHelper.getUserContexts(
  userData.profile.id!,
);

// Debug: Log actual contexts found
console.log('Found contexts:', contexts.length);
contexts.forEach((c) => console.log('  -', c.context_name, c.description));

// Migration 023 creates 3 default contexts (Professional, Social, Public) for every new user
// Test creates 3 additional contexts, so we should expect 6 total contexts
expect(contexts).toHaveLength(6);

// Verify the 3 default contexts exist
const defaultContextNames = ['Professional', 'Social', 'Public'];
const defaultContexts = contexts.filter((c) =>
  defaultContextNames.includes(c.context_name),
);
expect(defaultContexts).toHaveLength(3);

// Verify the 3 test-created contexts exist
const testContextNames = [
  'Legal Documents',
  'Professional Work',
  'Close Friends',
];
const testContexts = contexts.filter((c) =>
  testContextNames.includes(c.context_name),
);
expect(testContexts).toHaveLength(3);

// Test name resolution per context
const { data: legalName } = await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_context_name: 'Legal Documents',
});
expect(legalName).toBe('Jane Smith');

const { data: professionalName } = await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_context_name: 'Professional Work',
});
expect(professionalName).toBe('Jane Doe');

const { data: friendsName } = await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_context_name: 'Close Friends',
});
expect(friendsName).toBe('Janie');

// Test preferred name fallback
const { data: fallbackName } = await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
});
expect(fallbackName).toBe('Jane Doe'); // Should get preferred name
  });

  test('should handle professional vs personal names with context assignments', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const userData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-professional-${uniqueId}@example.test`,
  {
names: [
  {
name_text: 'Dr. Alexandra Johnson',
name_type: 'ALIAS',
is_preferred: false,
  },
  {
name_text: 'Alex Johnson',
name_type: 'PREFERRED',
is_preferred: true,
  },
  {
name_text: 'Alexandra Marie Johnson-Smith',
name_type: 'LEGAL',
is_preferred: false,
  },
],
contexts: [
  {
context_name: 'Academic Conferences',
description: 'Professional speaking and presentations',
assigned_name: 'Dr. Alexandra Johnson',
  },
  {
context_name: 'Team Meetings',
description: 'Internal team collaboration',
assigned_name: 'Alex Johnson',
  },
  {
context_name: 'HR & Legal',
description: 'Official company documentation',
assigned_name: 'Alexandra Marie Johnson-Smith',
  },
],
  },
);

const names = await DatabaseTestHelper.getNamesForUser(
  userData.profile.id!,
);
expect(names).toHaveLength(3);

// Test professional context resolution
const { data: academicName } = await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_context_name: 'Academic Conferences',
});
expect(academicName).toBe('Dr. Alexandra Johnson');

// Test team context resolution
const { data: teamName } = await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_context_name: 'Team Meetings',
});
expect(teamName).toBe('Alex Johnson');

// Test legal context resolution
const { data: legalName } = await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_context_name: 'HR & Legal',
});
expect(legalName).toBe('Alexandra Marie Johnson-Smith');
  });

  test('should maintain audit trail for name disclosures', async () => {
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
context_name: 'Test Context',
description: 'For audit testing',
assigned_name: 'Test User',
  },
],
  },
);

// Check audit log before any name resolution
const { data: beforeLogs } = await supabase
  .from('audit_log_entries')
  .select('*')
  .eq('target_user_id', userData.profile.id)
  .eq('action', 'NAME_DISCLOSED');

// Trigger name resolution to create audit entry
await supabase.rpc('resolve_name', {
  p_target_user_id: userData.profile.id,
  p_context_name: 'Test Context',
});

// Verify audit entry was created
const { data: auditEntries } = await supabase
  .from('audit_log_entries')
  .select('*')
  .eq('target_user_id', userData.profile.id)
  .eq('action', 'NAME_DISCLOSED');

expect(auditEntries?.length).toBe((beforeLogs?.length || 0) + 1);
expect(auditEntries?.[0]).toMatchObject({
  target_user_id: userData.profile.id,
  action: 'NAME_DISCLOSED',
});

// Verify timestamp exists and is recent
const auditEntry = auditEntries?.[0];
expect(auditEntry?.accessed_at).toBeDefined();
const auditTime = new Date(auditEntry!.accessed_at);
const now = new Date();
const timeDiff = now.getTime() - auditTime.getTime();
expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
  });

  test('should validate name types using ENUMs', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-validation-${uniqueId}@example.test`,
);

// Test valid ENUM combinations with new schema
const validTypes = ['LEGAL', 'PREFERRED', 'NICKNAME', 'ALIAS'];

for (const name_type of validTypes) {
  const name = await DatabaseTestHelper.createName(profile.id!, {
name_text: `Test ${name_type} Name`,
name_type: name_type as any,
is_preferred: name_type === 'PREFERRED',
source: 'test_data',
  });
  expect(name.name_type).toBe(name_type);
}

const allNames = await DatabaseTestHelper.getNamesForUser(profile.id!);
expect(allNames).toHaveLength(4);

// Verify preferred name constraint
const preferredNames = allNames.filter((n) => n.is_preferred);
expect(preferredNames).toHaveLength(1);
expect(preferredNames[0].name_type).toBe('PREFERRED');
  });

  test('should test preferred name uniqueness constraint', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-preferred-unique-${uniqueId}@example.test`,
);

// Create first preferred name
await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'First Preferred',
  name_type: 'PREFERRED',
  is_preferred: true,
});

// Attempt to create second preferred name - should fail due to unique constraint
let threwError = false;
let errorMessage = '';

try {
  const duplicatePreferred = await DatabaseTestHelper.createName(
profile.id!,
{
  name_text: 'Second Preferred',
  name_type: 'PREFERRED',
  is_preferred: true,
},
  );
  console.log(
'ERROR: Second preferred name was created!',
duplicatePreferred,
  );
} catch (error) {
  threwError = true;
  errorMessage = error.message;
  console.log('SUCCESS: Error thrown as expected:', errorMessage);
}

expect(threwError).toBe(true);
expect(errorMessage).toContain(
  'duplicate key value violates unique constraint',
);
  });
});
