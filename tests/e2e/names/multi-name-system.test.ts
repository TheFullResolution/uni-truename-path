import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { testProfiles } from '../fixtures/test-data';

test.describe('Multi-Name System Integration', () => {
  test.beforeEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should support complex name scenarios', async () => {
// Create a profile with multiple name changes over time
const profile = await DatabaseTestHelper.createProfile('complex@example.com');

// Scenario: Person born as "Jane Smith", prefers "Jane Doe", nicknamed "Janie"
const legalName = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Jane Smith',
  type: 'legal',
  visibility: 'restricted',
  source: 'birth_certificate'
});

const preferredName = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Jane Doe',
  type: 'preferred',
  visibility: 'public',
  source: 'personal_preference'
});

const nickname = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Janie',
  type: 'nickname',
  visibility: 'internal',
  source: 'friends_family'
});

// Verify all names are stored
const names = await DatabaseTestHelper.getNamesForProfile(profile.id!);
expect(names).toHaveLength(3);

// Verify privacy levels
const publicNames = names.filter(n => n.visibility === 'public');
const restrictedNames = names.filter(n => n.visibility === 'restricted');
const internalNames = names.filter(n => n.visibility === 'internal');

expect(publicNames).toHaveLength(1);
expect(publicNames[0].name_text).toBe('Jane Doe');

expect(restrictedNames).toHaveLength(1);
expect(restrictedNames[0].name_text).toBe('Jane Smith');

expect(internalNames).toHaveLength(1);
expect(internalNames[0].name_text).toBe('Janie');
  });

  test('should handle professional vs personal names', async () => {
const profile = await DatabaseTestHelper.createProfile('professional@example.com');

// Professional alias
await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Dr. Alexandra Johnson',
  type: 'alias',
  visibility: 'public',
  source: 'professional_title'
});

// Personal preferred name
await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Alex Johnson',
  type: 'preferred',
  visibility: 'internal',
  source: 'personal_preference'
});

// Legal name (private)
await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Alexandra Marie Johnson-Smith',
  type: 'legal',
  visibility: 'private',
  source: 'legal_documents'
});

const names = await DatabaseTestHelper.getNamesForProfile(profile.id!);
expect(names).toHaveLength(3);

// Verify professional context visibility
const professionalNames = names.filter(n => 
  n.visibility === 'public' && n.name_text.includes('Dr.')
);
expect(professionalNames).toHaveLength(1);
  });

  test('should maintain audit trail', async () => {
// This test would verify that the audit trigger is working
// For now, we'll just ensure names are created with timestamps
const profile = await DatabaseTestHelper.createProfile('audit@example.com');

const beforeTime = new Date();

const name = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'Test Name',
  type: 'preferred',
  visibility: 'public'
});

const afterTime = new Date();

expect(name.created_at).toBeDefined();
const createdAt = new Date(name.created_at!);
expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
expect(createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  test('should validate name types and visibility', async () => {
const profile = await DatabaseTestHelper.createProfile('validation@example.com');

// Test valid combinations
const validTypes = ['legal', 'preferred', 'nickname', 'alias'];
const validVisibilities = ['public', 'internal', 'restricted', 'private'];

for (const type of validTypes) {
  for (const visibility of validVisibilities) {
const name = await DatabaseTestHelper.createName(profile.id!, {
  name_text: `${type}-${visibility}`,
  type: type as any,
  visibility: visibility as any
});
expect(name.type).toBe(type);
expect(name.visibility).toBe(visibility);
  }
}

const allNames = await DatabaseTestHelper.getNamesForProfile(profile.id!);
expect(allNames).toHaveLength(16); // 4 types × 4 visibility levels
  });
});