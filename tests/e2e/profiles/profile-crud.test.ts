import { test, expect } from '@playwright/test';
import { DatabaseTestHelper } from '../../utils/db-helpers';
import { AuthHelper } from '../../utils/auth-helpers';
import { testProfiles } from '../fixtures/test-data';

test.describe('Profile CRUD Operations', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
authHelper = new AuthHelper(page);
await DatabaseTestHelper.cleanup();
  });

  test.afterEach(async () => {
await DatabaseTestHelper.cleanup();
  });

  test('should create a new profile', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const testEmail = `test-profile-${uniqueId}@example.test`;

// Create profile via database
const profile = await DatabaseTestHelper.createProfile(testEmail);
expect(profile.email).toBe(testEmail);
expect(profile.id).toBeDefined();

// Verify profile exists in database
const retrievedProfile =
  await DatabaseTestHelper.getProfileByEmail(testEmail);
expect(retrievedProfile).toBeTruthy();
expect(retrievedProfile!.email).toBe(testEmail);
  });

  test('should create multiple names for a profile', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const testEmail = `test-names-${uniqueId}@example.test`;
const testData = testProfiles.johnDoe;

// Create profile
const profile = await DatabaseTestHelper.createProfile(testEmail);

// Create names
const names = [];
for (const nameData of testData.names) {
  const name = await DatabaseTestHelper.createName(profile.id!, nameData);
  names.push(name);
}

expect(names).toHaveLength(2);
expect(names[0].name_text).toBe('John Doe');
expect(names[0].type).toBe('legal');
expect(names[1].name_text).toBe('Johnny');
expect(names[1].type).toBe('nickname');

// Verify names in database
const retrievedNames = await DatabaseTestHelper.getNamesForProfile(
  profile.id!,
);
expect(retrievedNames).toHaveLength(2);
  });

  test('should handle name visibility levels', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-visibility-${uniqueId}@example.test`,
);

const visibilityLevels = [
  'public',
  'internal',
  'restricted',
  'private',
] as const;

for (const visibility of visibilityLevels) {
  const name = await DatabaseTestHelper.createName(profile.id!, {
name_text: `Name ${visibility}`,
type: 'alias',
visibility,
  });
  // Verify each name was created
  expect(name).toBeTruthy();
  expect(name.name_text).toBe(`Name ${visibility}`);
}

const names = await DatabaseTestHelper.getNamesForProfile(profile.id!);
expect(names).toHaveLength(4);

// Verify each visibility level was set correctly
for (const visibility of visibilityLevels) {
  const name = names.find((n) => n.name_text === `Name ${visibility}`);
  expect(name).toBeTruthy();
  expect(name!.visibility).toBe(visibility);
}
  });

  test('should handle different name types', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-types-${uniqueId}@example.test`,
);

const nameTypes = ['legal', 'preferred', 'nickname', 'alias'] as const;

for (const type of nameTypes) {
  const name = await DatabaseTestHelper.createName(profile.id!, {
name_text: `${type} name`,
type,
visibility: 'public',
  });
  // Verify each name was created
  expect(name).toBeTruthy();
  expect(name.type).toBe(type);
}

const names = await DatabaseTestHelper.getNamesForProfile(profile.id!);
expect(names).toHaveLength(4);

// Verify each type was set correctly
for (const type of nameTypes) {
  const name = names.find((n) => n.type === type);
  expect(name).toBeTruthy();
  expect(name!.name_text).toBe(`${type} name`);
}
  });
});
