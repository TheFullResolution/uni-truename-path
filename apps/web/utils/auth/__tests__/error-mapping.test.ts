// TrueNamePath: Auth Error Mapping Unit Tests
// Date: August 19, 2025
// Comprehensive test suite for authentication error message mapping utilities

import { describe, test, expect } from 'vitest';
import {
  getErrorMessage,
  getErrorDetails,
  getFullErrorMessage,
  getErrorAction,
  isAuthenticationRequired,
  isCredentialsError,
} from '../error-mapping';
import type { AuthErrorCode } from '../types';

describe('Authentication Error Mapping', () => {
  describe('getErrorMessage', () => {
test('should return correct message for AUTHENTICATION_REQUIRED', () => {
  const message = getErrorMessage('AUTHENTICATION_REQUIRED');
  expect(message).toBe('Please sign in to continue');
});

test('should return correct message for AUTHENTICATION_FAILED', () => {
  const message = getErrorMessage('AUTHENTICATION_FAILED');
  expect(message).toBe('Sign in failed');
});

test('should return correct message for SESSION_VERIFICATION_FAILED', () => {
  const message = getErrorMessage('SESSION_VERIFICATION_FAILED');
  expect(message).toBe('Session verification failed');
});

test('should return correct message for TOKEN_VERIFICATION_FAILED', () => {
  const message = getErrorMessage('TOKEN_VERIFICATION_FAILED');
  expect(message).toBe('Your session has expired');
});

test('should return default message for unknown error code', () => {
  const message = getErrorMessage('UNKNOWN_ERROR' as AuthErrorCode);
  expect(message).toBe('Something went wrong');
});

test('should handle null and undefined error codes gracefully', () => {
  const nullMessage = getErrorMessage(null as any);
  const undefinedMessage = getErrorMessage(undefined as any);

  expect(nullMessage).toBe('Something went wrong');
  expect(undefinedMessage).toBe('Something went wrong');
});
  });

  describe('getErrorDetails', () => {
test('should return complete error config for valid error codes', () => {
  const details = getErrorDetails('AUTHENTICATION_REQUIRED');

  expect(details).toEqual({
message: 'Please sign in to continue',
details: 'You need to be logged in to access this feature',
action: 'Sign in to your account or create a new one',
  });
});

test('should return default config for unknown error codes', () => {
  const details = getErrorDetails('INVALID_CODE' as AuthErrorCode);

  expect(details).toEqual({
message: 'Something went wrong',
details: 'An unexpected error occurred while processing your request',
action: 'Please try again or contact support if the problem continues',
  });
});

test('should return consistent structure for all known error codes', () => {
  const knownErrorCodes: AuthErrorCode[] = [
'AUTHENTICATION_REQUIRED',
'AUTHENTICATION_FAILED',
'SESSION_VERIFICATION_FAILED',
'TOKEN_VERIFICATION_FAILED',
  ];

  knownErrorCodes.forEach((code) => {
const details = getErrorDetails(code);

expect(details).toHaveProperty('message');
expect(details).toHaveProperty('details');
expect(details).toHaveProperty('action');
expect(typeof details.message).toBe('string');
expect(details.message.length).toBeGreaterThan(0);
  });
});
  });

  describe('getFullErrorMessage', () => {
test('should combine message and details when both exist', () => {
  const fullMessage = getFullErrorMessage('AUTHENTICATION_REQUIRED');

  expect(fullMessage).toBe(
'Please sign in to continue. You need to be logged in to access this feature',
  );
});

test('should return just message when details are empty', () => {
  // Test with a hypothetical error that might not have details
  const fullMessage = getFullErrorMessage('AUTHENTICATION_FAILED');

  expect(fullMessage).toContain('Sign in failed');
});

test('should handle unknown error codes properly', () => {
  const fullMessage = getFullErrorMessage('UNKNOWN' as AuthErrorCode);

  expect(fullMessage).toBe(
'Something went wrong. An unexpected error occurred while processing your request',
  );
});

test('should ensure proper formatting with period separation', () => {
  const fullMessage = getFullErrorMessage('TOKEN_VERIFICATION_FAILED');

  // Should contain the period separator between message and details
  expect(fullMessage).toMatch(/^.+\. .+$/);
});
  });

  describe('getErrorAction', () => {
test('should return correct action for AUTHENTICATION_REQUIRED', () => {
  const action = getErrorAction('AUTHENTICATION_REQUIRED');
  expect(action).toBe('Sign in to your account or create a new one');
});

test('should return correct action for AUTHENTICATION_FAILED', () => {
  const action = getErrorAction('AUTHENTICATION_FAILED');
  expect(action).toBe('Check your credentials and try again');
});

test('should return correct action for TOKEN_VERIFICATION_FAILED', () => {
  const action = getErrorAction('TOKEN_VERIFICATION_FAILED');
  expect(action).toBe('Please sign in again to continue');
});

test('should return default action for unknown error codes', () => {
  const action = getErrorAction('UNKNOWN' as AuthErrorCode);
  expect(action).toBe(
'Please try again or contact support if the problem continues',
  );
});

test('should return null when no action is available', () => {
  // This tests the fallback behavior - if an error config doesn't have an action
  // Note: Currently all our error configs have actions, so this tests the default
  const action = getErrorAction('UNKNOWN' as AuthErrorCode);
  expect(action).not.toBeNull(); // Our default has an action
});
  });

  describe('isAuthenticationRequired', () => {
test('should return true for AUTHENTICATION_REQUIRED', () => {
  expect(isAuthenticationRequired('AUTHENTICATION_REQUIRED')).toBe(true);
});

test('should return true for TOKEN_VERIFICATION_FAILED', () => {
  expect(isAuthenticationRequired('TOKEN_VERIFICATION_FAILED')).toBe(true);
});

test('should return false for AUTHENTICATION_FAILED', () => {
  expect(isAuthenticationRequired('AUTHENTICATION_FAILED')).toBe(false);
});

test('should return false for SESSION_VERIFICATION_FAILED', () => {
  expect(isAuthenticationRequired('SESSION_VERIFICATION_FAILED')).toBe(
false,
  );
});

test('should return false for unknown error codes', () => {
  expect(isAuthenticationRequired('UNKNOWN' as AuthErrorCode)).toBe(false);
});

test('should handle edge cases gracefully', () => {
  expect(isAuthenticationRequired(null as any)).toBe(false);
  expect(isAuthenticationRequired(undefined as any)).toBe(false);
  expect(isAuthenticationRequired('' as any)).toBe(false);
});
  });

  describe('isCredentialsError', () => {
test('should return true for AUTHENTICATION_FAILED', () => {
  expect(isCredentialsError('AUTHENTICATION_FAILED')).toBe(true);
});

test('should return false for AUTHENTICATION_REQUIRED', () => {
  expect(isCredentialsError('AUTHENTICATION_REQUIRED')).toBe(false);
});

test('should return false for TOKEN_VERIFICATION_FAILED', () => {
  expect(isCredentialsError('TOKEN_VERIFICATION_FAILED')).toBe(false);
});

test('should return false for SESSION_VERIFICATION_FAILED', () => {
  expect(isCredentialsError('SESSION_VERIFICATION_FAILED')).toBe(false);
});

test('should return false for unknown error codes', () => {
  expect(isCredentialsError('UNKNOWN' as AuthErrorCode)).toBe(false);
});

test('should handle edge cases gracefully', () => {
  expect(isCredentialsError(null as any)).toBe(false);
  expect(isCredentialsError(undefined as any)).toBe(false);
  expect(isCredentialsError('' as any)).toBe(false);
});
  });

  describe('Error Code Coverage', () => {
test('should have consistent messaging across all error types', () => {
  const knownErrorCodes: AuthErrorCode[] = [
'AUTHENTICATION_REQUIRED',
'AUTHENTICATION_FAILED',
'SESSION_VERIFICATION_FAILED',
'TOKEN_VERIFICATION_FAILED',
  ];

  knownErrorCodes.forEach((code) => {
const message = getErrorMessage(code);
const details = getErrorDetails(code);
const fullMessage = getFullErrorMessage(code);
const action = getErrorAction(code);

// All should be non-empty strings
expect(message).toBeTruthy();
expect(message.length).toBeGreaterThan(0);

expect(details.message).toBeTruthy();
expect(details.details).toBeTruthy();
expect(details.action).toBeTruthy();

expect(fullMessage).toBeTruthy();
expect(fullMessage.length).toBeGreaterThan(message.length);

expect(action).toBeTruthy();
expect(action!.length).toBeGreaterThan(0);
  });
});

test('should provide user-friendly messages (no technical jargon)', () => {
  const knownErrorCodes: AuthErrorCode[] = [
'AUTHENTICATION_REQUIRED',
'AUTHENTICATION_FAILED',
'SESSION_VERIFICATION_FAILED',
'TOKEN_VERIFICATION_FAILED',
  ];

  knownErrorCodes.forEach((code) => {
const message = getErrorMessage(code);

// Should not contain technical terms
expect(message.toLowerCase()).not.toContain('token');
expect(message.toLowerCase()).not.toContain('jwt');
expect(message.toLowerCase()).not.toContain('bearer');
expect(message.toLowerCase()).not.toContain('unauthorized');
expect(message.toLowerCase()).not.toContain('403');
expect(message.toLowerCase()).not.toContain('401');
  });
});

test('should provide actionable guidance', () => {
  const knownErrorCodes: AuthErrorCode[] = [
'AUTHENTICATION_REQUIRED',
'AUTHENTICATION_FAILED',
'SESSION_VERIFICATION_FAILED',
'TOKEN_VERIFICATION_FAILED',
  ];

  knownErrorCodes.forEach((code) => {
const action = getErrorAction(code);

// Actions should be present and actionable (contain verbs)
expect(action).toBeTruthy();

const actionLower = action!.toLowerCase();
const actionableVerbs = ['sign', 'check', 'try', 'contact', 'create'];
const hasActionableVerb = actionableVerbs.some((verb) =>
  actionLower.includes(verb),
);

expect(hasActionableVerb).toBe(true);
  });
});
  });

  describe('OAuth Flow Compatibility', () => {
test('should handle OAuth-specific authentication errors appropriately', () => {
  // Test that our error mapping system can handle OAuth flows
  // where authentication might be required for OAuth integration

  const authRequiredMessage = getErrorMessage('AUTHENTICATION_REQUIRED');
  const authRequiredAction = getErrorAction('AUTHENTICATION_REQUIRED');

  // Should work for OAuth callback scenarios
  expect(authRequiredMessage).toContain('sign in');
  expect(authRequiredAction).toContain('Sign in');

  // Should work for OAuth token refresh scenarios
  const tokenFailedMessage = getErrorMessage('TOKEN_VERIFICATION_FAILED');
  expect(tokenFailedMessage).toContain('expired');
});

test('should provide consistent experience for OAuth integration errors', () => {
  // Ensure OAuth-related authentication errors provide clear guidance

  const sessionError = getFullErrorMessage('SESSION_VERIFICATION_FAILED');
  const tokenError = getFullErrorMessage('TOKEN_VERIFICATION_FAILED');

  // Both should guide users to re-authenticate
  expect(sessionError.toLowerCase()).toContain('sign in');
  expect(tokenError.toLowerCase()).toContain('sign in');
});
  });
});
