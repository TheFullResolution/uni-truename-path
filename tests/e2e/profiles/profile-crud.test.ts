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
expect(names[0].name_type).toBe('LEGAL');
expect(names[0].is_preferred).toBe(false);
expect(names[1].name_text).toBe('Johnny');
expect(names[1].name_type).toBe('NICKNAME');
expect(names[1].is_preferred).toBe(true);

// Verify names in database
const retrievedNames = await DatabaseTestHelper.getNamesForProfile(
  profile.id!,
);
expect(retrievedNames).toHaveLength(2);
  });

  test('should handle name types with preferred name enforcement', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-name-types-${uniqueId}@example.test`,
);

const nameTypes = ['LEGAL', 'PREFERRED', 'NICKNAME', 'ALIAS'] as const;

// Create names with different types (only one can be preferred)
const createdNames = [];
for (let i = 0; i < nameTypes.length; i++) {
  const nameType = nameTypes[i];
  const name = await DatabaseTestHelper.createName(profile.id!, {
name_text: `Name ${nameType}`,
name_type: nameType,
is_preferred: nameType === 'PREFERRED', // Only PREFERRED type is marked as preferred
  });
  createdNames.push(name);

  // Verify each name was created with correct type
  expect(name).toBeTruthy();
  expect(name.name_text).toBe(`Name ${nameType}`);
  expect(name.name_type).toBe(nameType);
  expect(name.is_preferred).toBe(nameType === 'PREFERRED');
}

const names = await DatabaseTestHelper.getNamesForProfile(profile.id!);
expect(names).toHaveLength(4);

// Verify only one name is marked as preferred
const preferredNames = names.filter((n) => n.is_preferred);
expect(preferredNames).toHaveLength(1);
expect(preferredNames[0].name_type).toBe('PREFERRED');
  });

  test('should handle different name types with ENUM validation', async () => {
const uniqueId = Math.random().toString(36).substring(7);
const profile = await DatabaseTestHelper.createProfile(
  `test-types-${uniqueId}@example.test`,
);

const nameTypes = ['LEGAL', 'PREFERRED', 'NICKNAME', 'ALIAS'] as const;

// Create first name with preferred status
const preferredName = await DatabaseTestHelper.createName(profile.id!, {
  name_text: 'PREFERRED name',
  name_type: 'PREFERRED',
  is_preferred: true,
});
expect(preferredName.name_type).toBe('PREFERRED');
expect(preferredName.is_preferred).toBe(true);

// Create other names without preferred status
for (const nameType of ['LEGAL', 'NICKNAME', 'ALIAS'] as const) {
  const name = await DatabaseTestHelper.createName(profile.id!, {
name_text: `${nameType} name`,
name_type: nameType,
is_preferred: false,
  });

  // Verify each name was created with correct ENUM type
  expect(name).toBeTruthy();
  expect(name.name_type).toBe(nameType);
  expect(name.is_preferred).toBe(false);
}

const names = await DatabaseTestHelper.getNamesForProfile(profile.id!);
expect(names).toHaveLength(4);

// Verify each ENUM type was set correctly
for (const nameType of nameTypes) {
  const name = names.find((n) => n.name_type === nameType);
  expect(name).toBeTruthy();
  expect(name!.name_text).toBe(`${nameType} name`);
}

// Verify only one preferred name exists
const preferredNames = names.filter((n) => n.is_preferred);
expect(preferredNames).toHaveLength(1);
  });
});
