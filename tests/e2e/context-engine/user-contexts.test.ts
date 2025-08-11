import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { supabase } from '../../utils/db-helpers';

test.describe('User-Defined Contexts - Core Innovation', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should create user contexts and manage context-name assignments', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-contexts-${uniqueId}@example.test`,
);

// Create multiple name variants
const legalName = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Alexandra Smith',
  name_type: 'LEGAL',
  is_preferred: false,
  verified: true,
  source: 'legal_documents',
});

const preferredName = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Alex',
  name_type: 'PREFERRED',
  is_preferred: true,
  verified: false,
  source: 'personal_preference',
});

const alias = await DatabaseTestHelper.createName(profile.id!, {
  name_text: '@CodeAlex',
  name_type: 'ALIAS',
  is_preferred: false,
  verified: false,
  source: 'online_handle',
});

// Create user-defined contexts
const workContext = await DatabaseTestHelper.createUserContext(
  profile.id!,
  {
context_name: 'Development Community',
description: 'GitHub, Stack Overflow, tech forums',
  },
);

const professionalContext = await DatabaseTestHelper.createUserContext(
  profile.id!,
  {
context_name: 'Professional Services',
description: 'Client meetings, consulting work',
  },
);

const casualContext = await DatabaseTestHelper.createUserContext(
  profile.id!,
  {
context_name: 'Casual Acquaintances',
description: 'Social media, casual networking',
  },
);

// Verify contexts were created
const userContexts = await DatabaseTestHelper.getUserContexts(profile.id!);
expect(userContexts).toHaveLength(3);
expect(userContexts.map((c) => c.context_name)).toEqual(
  expect.arrayContaining([
'Development Community',
'Professional Services',
'Casual Acquaintances',
  ]),
);

// Create context-name assignments
await DatabaseTestHelper.createContextNameAssignment({
  user_id: profile.id!,
  context_id: workContext.id!,
  name_id: alias.id!,
});

await DatabaseTestHelper.createContextNameAssignment({
  user_id: profile.id!,
  context_id: professionalContext.id!,
  name_id: legalName.id!,
});

await DatabaseTestHelper.createContextNameAssignment({
  user_id: profile.id!,
  context_id: casualContext.id!,
  name_id: preferredName.id!,
});

// Verify assignments work correctly
const assignments = await DatabaseTestHelper.getContextNameAssignments(
  profile.id!,
);
expect(assignments).toHaveLength(3);

// Test name resolution for each context
const { data: devName } = await supabase.rpc('resolve_name', {
  p_target_user_id: profile.id,
  p_requester_user_id: null,
  p_context_name: 'Development Community',
});
expect(devName).toBe('@CodeAlex');

const { data: profName } = await supabase.rpc('resolve_name', {
  p_target_user_id: profile.id,
  p_requester_user_id: null,
  p_context_name: 'Professional Services',
});
expect(profName).toBe('Alexandra Smith');

const { data: casualName } = await supabase.rpc('resolve_name', {
  p_target_user_id: profile.id,
  p_requester_user_id: null,
  p_context_name: 'Casual Acquaintances',
});
expect(casualName).toBe('Alex');
  });

  test('should prevent duplicate context names for same user', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-duplicate-${uniqueId}@example.test`,
);

// Create first context
const firstContext = await DatabaseTestHelper.createUserContext(
  profile.id!,
  {
context_name: 'Work Context',
description: 'First work context',
  },
);

console.log('First context created:', firstContext);

// Attempt to create duplicate context name - should fail
let threwError = false;
let errorMessage = '';

try {
  const duplicateContext = await DatabaseTestHelper.createUserContext(
profile.id!,
{
  context_name: 'Work Context',
  description: 'Duplicate work context',
},
  );
  console.log('ERROR: Duplicate context was created!', duplicateContext);
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

  test('should enforce one name per context constraint', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-constraint-${uniqueId}@example.test`,
);

// Create names and context
const name1 = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Name One',
  name_type: 'PREFERRED',
  is_preferred: true,
});

const name2 = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Name Two',
  name_type: 'ALIAS',
  is_preferred: false,
});

const context = await DatabaseTestHelper.createUserContext(profile.id!, {
  context_name: 'Test Context',
  description: 'Testing unique constraint',
});

// Create first assignment
const firstAssignment =
  await DatabaseTestHelper.createContextNameAssignment({
user_id: profile.id!,
context_id: context.id!,
name_id: name1.id!,
  });

console.log('First assignment created:', firstAssignment);

// Attempt to create second assignment for same context - should fail
let threwError = false;
let errorMessage = '';

try {
  const duplicateAssignment =
await DatabaseTestHelper.createContextNameAssignment({
  user_id: profile.id!,
  context_id: context.id!,
  name_id: name2.id!,
});
  console.log(
'ERROR: Duplicate assignment was created!',
duplicateAssignment,
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

  test('should test academic personas with user-defined contexts', async () => {
const uniqueId = Math.random().toString(36).substring(7);

// Test JJ persona with realistic contexts
const jjData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-jj-academic-${uniqueId}@example.test`,
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
description: 'Professional workplace',
assigned_name: 'Jędrzej Lewandowski',
  },
  {
context_name: 'Gaming Friends',
description: 'Gaming and casual social',
assigned_name: 'JJ',
  },
  {
context_name: 'Open Source',
description: 'GitHub and code contributions',
assigned_name: 'J. Lewandowski',
  },
],
  },
);

// Verify JJ's contexts resolve correctly
const { data: jjWork } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_context_name: 'Work Colleagues',
});
expect(jjWork).toBe('Jędrzej Lewandowski');

const { data: jjGaming } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_context_name: 'Gaming Friends',
});
expect(jjGaming).toBe('JJ');

const { data: jjOpenSource } = await supabase.rpc('resolve_name', {
  p_target_user_id: jjData.profile.id,
  p_context_name: 'Open Source',
});
expect(jjOpenSource).toBe('J. Lewandowski');

// Test Li Wei persona
const liWeiData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-liwei-academic-${uniqueId}@example.test`,
  {
names: [
  { name_text: '李伟', name_type: 'LEGAL', is_preferred: false },
  { name_text: 'Li Wei', name_type: 'PREFERRED', is_preferred: true },
  { name_text: 'Wei', name_type: 'NICKNAME', is_preferred: false },
],
contexts: [
  {
context_name: 'Professional Network',
description: 'LinkedIn, business meetings',
assigned_name: 'Li Wei',
  },
  {
context_name: 'Close Friends',
description: 'Personal friendships',
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

// Verify Li Wei's contexts resolve correctly
const { data: liWeiProfessional } = await supabase.rpc('resolve_name', {
  p_target_user_id: liWeiData.profile.id,
  p_context_name: 'Professional Network',
});
expect(liWeiProfessional).toBe('Li Wei');

const { data: liWeiFriends } = await supabase.rpc('resolve_name', {
  p_target_user_id: liWeiData.profile.id,
  p_context_name: 'Close Friends',
});
expect(liWeiFriends).toBe('Wei');

const { data: liWeiFamily } = await supabase.rpc('resolve_name', {
  p_target_user_id: liWeiData.profile.id,
  p_context_name: 'Family & Cultural',
});
expect(liWeiFamily).toBe('李伟');

// Test Alex persona
const alexData = await DatabaseTestHelper.createPersonaWithContexts(
  `test-alex-academic-${uniqueId}@example.test`,
  {
names: [
  { name_text: 'Alex Smith', name_type: 'LEGAL', is_preferred: false },
  { name_text: 'Alex', name_type: 'PREFERRED', is_preferred: true },
  { name_text: '@CodeAlex', name_type: 'ALIAS', is_preferred: false },
],
contexts: [
  {
context_name: 'Development Community',
description: 'GitHub, tech forums',
assigned_name: '@CodeAlex',
  },
  {
context_name: 'Professional Services',
description: 'Client work, consulting',
assigned_name: 'Alex Smith',
  },
  {
context_name: 'Casual Acquaintances',
description: 'Social, networking events',
assigned_name: 'Alex',
  },
],
  },
);

// Verify Alex's contexts resolve correctly
const { data: alexDev } = await supabase.rpc('resolve_name', {
  p_target_user_id: alexData.profile.id,
  p_context_name: 'Development Community',
});
expect(alexDev).toBe('@CodeAlex');

const { data: alexProfessional } = await supabase.rpc('resolve_name', {
  p_target_user_id: alexData.profile.id,
  p_context_name: 'Professional Services',
});
expect(alexProfessional).toBe('Alex Smith');

const { data: alexCasual } = await supabase.rpc('resolve_name', {
  p_target_user_id: alexData.profile.id,
  p_context_name: 'Casual Acquaintances',
});
expect(alexCasual).toBe('Alex');
  });

  test('should validate context-user relationship isolation', async () => {
const uniqueId = Math.random().toString(36).substring(7);

// Create two users with similar context names
const user1Data = await DatabaseTestHelper.createPersonaWithContexts(
  `test-user1-${uniqueId}@example.test`,
  {
names: [
  { name_text: 'User One', name_type: 'PREFERRED', is_preferred: true },
],
contexts: [
  {
context_name: 'Work',
description: 'User 1 work context',
assigned_name: 'User One',
  },
],
  },
);

const user2Data = await DatabaseTestHelper.createPersonaWithContexts(
  `test-user2-${uniqueId}@example.test`,
  {
names: [
  { name_text: 'User Two', name_type: 'PREFERRED', is_preferred: true },
],
contexts: [
  {
context_name: 'Work',
description: 'User 2 work context',
assigned_name: 'User Two',
  },
],
  },
);

// Test that User 1's "Work" context only affects User 1
const { data: user1WorkName } = await supabase.rpc('resolve_name', {
  p_target_user_id: user1Data.profile.id,
  p_context_name: 'Work',
});
expect(user1WorkName).toBe('User One');

// Test that User 2's "Work" context only affects User 2
const { data: user2WorkName } = await supabase.rpc('resolve_name', {
  p_target_user_id: user2Data.profile.id,
  p_context_name: 'Work',
});
expect(user2WorkName).toBe('User Two');

// Verify contexts are properly isolated - User 1 can't resolve User 2's contexts
const user1Contexts = await DatabaseTestHelper.getUserContexts(
  user1Data.profile.id!,
);
const user2Contexts = await DatabaseTestHelper.getUserContexts(
  user2Data.profile.id!,
);

expect(user1Contexts).toHaveLength(1);
expect(user2Contexts).toHaveLength(1);
expect(user1Contexts[0].user_id).toBe(user1Data.profile.id);
expect(user2Contexts[0].user_id).toBe(user2Data.profile.id);
  });
});
