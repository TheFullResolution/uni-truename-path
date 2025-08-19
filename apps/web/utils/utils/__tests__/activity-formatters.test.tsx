// TrueNamePath: Activity Formatters Unit Tests
// Date: August 19, 2025
// Comprehensive test suite for activity formatting utilities

import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { formatActivityAction, getActivityIcon } from '../activity-formatters';

// Mock Tabler icons to avoid React rendering issues in test environment
vi.mock('@tabler/icons-react', () => ({
  IconEye: vi.fn(({ size, color }: { size: number; color: string }) =>
React.createElement('div', { 'data-testid': 'IconEye', size, color }),
  ),
  IconShieldCheck: vi.fn(({ size, color }: { size: number; color: string }) =>
React.createElement('div', {
  'data-testid': 'IconShieldCheck',
  size,
  color,
}),
  ),
  IconUser: vi.fn(({ size, color }: { size: number; color: string }) =>
React.createElement('div', { 'data-testid': 'IconUser', size, color }),
  ),
  IconActivity: vi.fn(({ size, color }: { size: number; color: string }) =>
React.createElement('div', { 'data-testid': 'IconActivity', size, color }),
  ),
}));

describe('Activity Formatters', () => {
  describe('formatActivityAction', () => {
test('should format known activity actions correctly', () => {
  expect(formatActivityAction('name_resolution')).toBe('Name Resolved');
  expect(formatActivityAction('consent_granted')).toBe('Consent Granted');
  expect(formatActivityAction('consent_revoked')).toBe('Consent Revoked');
  expect(formatActivityAction('profile_updated')).toBe('Profile Updated');
  expect(formatActivityAction('name_created')).toBe('Name Added');
});

test('should handle unknown actions with fallback formatting', () => {
  expect(formatActivityAction('custom_action')).toBe('CUSTOM ACTION');
  expect(formatActivityAction('user_login')).toBe('USER LOGIN');
  expect(formatActivityAction('data_export')).toBe('DATA EXPORT');
});

test('should handle actions without underscores', () => {
  expect(formatActivityAction('login')).toBe('LOGIN');
  expect(formatActivityAction('logout')).toBe('LOGOUT');
  expect(formatActivityAction('test')).toBe('TEST');
});

test('should handle empty and edge case inputs', () => {
  expect(formatActivityAction('')).toBe('');
  expect(formatActivityAction('_')).toBe(' ');
  expect(formatActivityAction('__')).toBe('  ');
});

test('should handle actions with multiple underscores', () => {
  expect(formatActivityAction('user_profile_update')).toBe(
'USER PROFILE UPDATE',
  );
  expect(formatActivityAction('data_privacy_consent')).toBe(
'DATA PRIVACY CONSENT',
  );
});

test('should be case sensitive for known actions', () => {
  expect(formatActivityAction('NAME_RESOLUTION')).toBe('NAME RESOLUTION');
  expect(formatActivityAction('Name_Resolution')).toBe('NAME RESOLUTION');
  expect(formatActivityAction('name_Resolution')).toBe('NAME RESOLUTION');
});

test('should handle special characters gracefully', () => {
  expect(formatActivityAction('action-test')).toBe('ACTION-TEST');
  expect(formatActivityAction('action.test')).toBe('ACTION.TEST');
  expect(formatActivityAction('action@test')).toBe('ACTION@TEST');
});
  });

  describe('getActivityIcon', () => {
test('should return React element for all actions', () => {
  const actions = [
'name_resolution',
'consent_granted',
'consent_revoked',
'profile_updated',
'name_created',
'unknown_action',
'',
  ];

  actions.forEach((action) => {
const icon = getActivityIcon(action);
expect(icon).toBeTruthy();
expect(typeof icon).toBe('object');
  });
});

test('should maintain consistent icon properties', () => {
  const actions = [
'name_resolution',
'consent_granted',
'consent_revoked',
'profile_updated',
'name_created',
'unknown_action',
  ];

  actions.forEach((action) => {
const icon = getActivityIcon(action) as any;

expect(icon.props.size).toBe(16);
expect(icon.props.color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
  });

  describe('Icon Color Consistency', () => {
test('should use consistent colors for similar action types', () => {
  // Both consent actions should use shield icon but different colors
  const grantedIcon = getActivityIcon('consent_granted') as any;
  const revokedIcon = getActivityIcon('consent_revoked') as any;

  expect(grantedIcon.props.color).toBe('#27ae60'); // Green
  expect(revokedIcon.props.color).toBe('#e74c3c'); // Red
});

test('should use blue theme color for primary actions', () => {
  const resolutionIcon = getActivityIcon('name_resolution') as any;
  const profileIcon = getActivityIcon('profile_updated') as any;

  expect(resolutionIcon.props.color).toBe('#4A7FE7');
  expect(profileIcon.props.color).toBe('#4A7FE7');
});

test('should use green for positive/creation actions', () => {
  const consentIcon = getActivityIcon('consent_granted') as any;
  const nameIcon = getActivityIcon('name_created') as any;

  expect(consentIcon.props.color).toBe('#27ae60');
  expect(nameIcon.props.color).toBe('#27ae60');
});
  });

  describe('Integration with Audit Log UI', () => {
test('should produce compatible output for activity feed rendering', () => {
  // Test that formatted actions and icons work together for UI display
  const activities = [
'name_resolution',
'consent_granted',
'profile_updated',
'name_created',
  ];

  activities.forEach((action) => {
const formattedAction = formatActivityAction(action);
const icon = getActivityIcon(action) as any;

// Formatted action should be suitable for display
expect(formattedAction).toBeTruthy();
expect(formattedAction.length).toBeGreaterThan(0);
expect(formattedAction).not.toContain('_');

// Icon should be properly structured
expect(icon).toBeTruthy();
expect(icon.type).toBeTruthy();
expect(icon.props).toBeTruthy();
  });
});

test('should handle OAuth-related activity actions', () => {
  // Test OAuth integration scenarios for Step 15
  const oauthActions = [
'oauth_consent_granted',
'oauth_token_refresh',
'oauth_provider_linked',
  ];

  oauthActions.forEach((action) => {
const formatted = formatActivityAction(action);
const icon = getActivityIcon(action) as any;

// Should provide sensible fallback formatting
expect(formatted).toContain('OAUTH');
expect(formatted).not.toContain('_');

// Should provide default icon
expect(icon).toBeTruthy();
  });
});

test('should maintain accessibility with meaningful icons', () => {
  // Icons should have proper type and properties for accessibility
  const icon = getActivityIcon('consent_granted') as any;

  expect(icon).toBeTruthy();
  expect(icon.props.size).toBe(16);
  expect(icon.props.color).toBeTruthy();
});
  });

  describe('Performance Considerations', () => {
test('should handle rapid successive calls efficiently', () => {
  const startTime = performance.now();

  // Simulate rapid activity formatting (e.g., for activity feed)
  for (let i = 0; i < 1000; i++) {
formatActivityAction('name_resolution');
formatActivityAction('consent_granted');
formatActivityAction('unknown_action_' + i);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Should complete quickly (under 100ms for 3000 calls)
  expect(duration).toBeLessThan(100);
});

test('should handle icon generation efficiently', () => {
  const startTime = performance.now();

  // Simulate rapid icon generation
  for (let i = 0; i < 100; i++) {
getActivityIcon('name_resolution');
getActivityIcon('consent_granted');
getActivityIcon('unknown_action');
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Should complete quickly (under 50ms for 300 calls)
  expect(duration).toBeLessThan(50);
});
  });
});
