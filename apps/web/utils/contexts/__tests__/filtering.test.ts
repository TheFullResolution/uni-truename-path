import { describe, it, expect } from 'vitest';
import type { ContextWithStats } from '@/app/api/contexts/types';
import {
  filterAvailableContexts,
  getContextAvailabilityStatus,
  getUnavailableContexts,
} from '../filtering';

// Mock context data for testing (simplified - no visibility field)
const createMockContext = (
  overrides: Partial<ContextWithStats> = {},
): ContextWithStats => ({
  id: 'test-id',
  user_id: 'user-123',
  context_name: 'Test Context',
  description: null,
  is_permanent: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  has_active_consents: false,
  oidc_assignment_count: 3,
  is_complete: true,
  missing_properties: [],
  completion_status: 'complete', // Add the required field
  ...overrides,
});

describe('getContextAvailabilityStatus - Simplified Model', () => {
  it('should return available for complete regular context', () => {
const context = createMockContext({
  completion_status: 'complete',
});
const status = getContextAvailabilityStatus(context);

expect(status.available).toBe(true);
expect(status.reason).toBeUndefined();
  });

  it('should return available for partial context (has required properties)', () => {
const context = createMockContext({
  is_complete: false,
  completion_status: 'partial',
  missing_properties: ['email'], // Missing optional property
});
const status = getContextAvailabilityStatus(context);

expect(status.available).toBe(true);
expect(status.reason).toBeUndefined();
  });

  it('should return available for permanent (Public) context regardless of completeness', () => {
const context = createMockContext({
  is_permanent: true,
  context_name: 'Public',
  is_complete: false,
  completion_status: 'invalid', // Even if invalid, Public context is always available
});
const status = getContextAvailabilityStatus(context);

expect(status.available).toBe(true);
expect(status.reason).toBeUndefined();
  });

  it('should return unavailable for invalid context (missing required properties)', () => {
const context = createMockContext({
  is_complete: false,
  completion_status: 'invalid',
  missing_properties: ['given_name', 'family_name'],
});
const status = getContextAvailabilityStatus(context);

expect(status.available).toBe(false);
expect(status.reason).toBe('invalid');
expect(status.missingProperties).toEqual(['given_name', 'family_name']);
  });
});

describe('filterAvailableContexts - Simplified Model', () => {
  const contexts: ContextWithStats[] = [
createMockContext({
  id: '1',
  context_name: 'Public',
  is_permanent: true,
  completion_status: 'complete',
}),
createMockContext({
  id: '2',
  context_name: 'Complete Context',
  is_complete: true,
  completion_status: 'complete',
}),
createMockContext({
  id: '3',
  context_name: 'Partial Context',
  is_complete: false,
  completion_status: 'partial',
  missing_properties: ['email'], // Missing optional
}),
createMockContext({
  id: '4',
  context_name: 'Invalid Context',
  is_complete: false,
  completion_status: 'invalid',
  missing_properties: ['given_name', 'family_name'], // Missing required
}),
createMockContext({
  id: '5',
  context_name: 'Another Complete Context',
  is_complete: true,
  completion_status: 'complete',
}),
  ];

  it('should include complete, partial, and Public contexts (exclude only invalid)', () => {
const filtered = filterAvailableContexts(contexts);

// Should include all except the invalid context
expect(filtered).toHaveLength(4);
expect(filtered.map((c) => c.context_name)).toEqual([
  'Public',
  'Complete Context',
  'Partial Context', // Partial contexts are now included
  'Another Complete Context',
]);
  });

  it('should include incomplete Public context even if invalid', () => {
const contextsWithInvalidPublic: ContextWithStats[] = [
  createMockContext({
id: '1',
context_name: 'Public',
is_permanent: true,
is_complete: false,
completion_status: 'invalid',
missing_properties: ['given_name', 'family_name'],
  }),
  createMockContext({
id: '2',
context_name: 'Invalid Context',
is_complete: false,
completion_status: 'invalid',
missing_properties: ['given_name'],
  }),
];

const filtered = filterAvailableContexts(contextsWithInvalidPublic);

// Only Public context should be available (permanent contexts are always available)
expect(filtered).toHaveLength(1);
expect(filtered[0].context_name).toBe('Public');
  });
});

describe('getUnavailableContexts - Simplified Model', () => {
  it('should return only invalid contexts as unavailable', () => {
const contexts: ContextWithStats[] = [
  createMockContext({
id: '1',
context_name: 'Public',
is_permanent: true,
completion_status: 'complete',
  }),
  createMockContext({
id: '2',
context_name: 'Complete Context',
is_complete: true,
completion_status: 'complete',
  }),
  createMockContext({
id: '3',
context_name: 'Partial Context',
is_complete: false,
completion_status: 'partial',
missing_properties: ['email'],
  }),
  createMockContext({
id: '4',
context_name: 'Invalid Context',
is_complete: false,
completion_status: 'invalid',
missing_properties: ['given_name', 'family_name'],
  }),
];

const unavailable = getUnavailableContexts(contexts);

// Only invalid non-permanent contexts should be unavailable
expect(unavailable).toHaveLength(1);
expect(unavailable[0].context.context_name).toBe('Invalid Context');
expect(unavailable[0].status.reason).toBe('invalid');
expect(unavailable[0].status.missingProperties).toEqual([
  'given_name',
  'family_name',
]);
  });

  it('should not mark permanent contexts as unavailable even if invalid', () => {
const contexts: ContextWithStats[] = [
  createMockContext({
id: '1',
context_name: 'Public',
is_permanent: true,
is_complete: false,
completion_status: 'invalid',
missing_properties: ['given_name', 'family_name'],
  }),
];

const unavailable = getUnavailableContexts(contexts);

// Permanent contexts are never unavailable
expect(unavailable).toHaveLength(0);
  });
});
