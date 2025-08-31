// Auth Utils Tests

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  generateStateToken,
  validateStateToken,
  parseCallbackParams,
  isAuthenticated,
  getAuthState,
  buildAuthUrl,
} from '../auth-utils.js';
import { OAuthStorage, LocalStorageAdapter } from '../storage.js';
import { mockUUID, localStorageMock } from '../../vitest.setup';

describe('Auth Utils', () => {
  beforeEach(() => {
vi.clearAllMocks();
// Reset all mock implementations to their original state first
localStorageMock.getItem.mockImplementation((key: string) => {
  const store = localStorageMock.__getStore();
  return store[key] ?? null;
});
localStorageMock.setItem.mockImplementation(
  (key: string, value: string) => {
const store = localStorageMock.__getStore();
store[key] = value;
  },
);
localStorageMock.removeItem.mockImplementation((key: string) => {
  const store = localStorageMock.__getStore();
  delete store[key];
});
localStorageMock.clear.mockImplementation(() => {
  localStorageMock.__setStore({});
});
// Clear the localStorage data after resetting the mock
localStorageMock.__setStore({});
  });

  describe('generateStateToken', () => {
test('should generate a valid UUID string', () => {
  const token = generateStateToken();
  expect(token).toBe('mocked-uuid-12345');
  expect(mockUUID).toHaveBeenCalledOnce();
});

test('should generate unique tokens on each call', () => {
  mockUUID.mockReturnValueOnce('first-uuid');
  mockUUID.mockReturnValueOnce('second-uuid');

  const token1 = generateStateToken();
  const token2 = generateStateToken();

  expect(token1).toBe('first-uuid');
  expect(token2).toBe('second-uuid');
  expect(mockUUID).toHaveBeenCalledTimes(2);
});
  });

  describe('validateStateToken', () => {
test('should return true for matching tokens', () => {
  const expected = 'test-state-token';
  const received = 'test-state-token';

  const result = validateStateToken(expected, received);

  expect(result).toBe(true);
});

test('should return false for non-matching tokens', () => {
  const expected = 'expected-token';
  const received = 'different-token';

  const result = validateStateToken(expected, received);

  expect(result).toBe(false);
});

test('should handle empty strings', () => {
  expect(validateStateToken('', '')).toBe(true);
  expect(validateStateToken('token', '')).toBe(false);
  expect(validateStateToken('', 'token')).toBe(false);
});

test('should handle null and undefined values', () => {
  expect(validateStateToken('token', null as string | null)).toBe(false);
  expect(validateStateToken(null as string | null, 'token')).toBe(false);
  expect(
validateStateToken(
  undefined as string | undefined,
  undefined as string | undefined,
),
  ).toBe(true);
});
  });

  describe('parseCallbackParams', () => {
test('should extract token and state from query string', () => {
  const search = '?token=abc123&state=xyz789';

  const result = parseCallbackParams(search);

  expect(result).toEqual({
token: 'abc123',
state: 'xyz789',
  });
});

test('should handle missing parameters', () => {
  const search = '?token=abc123';

  const result = parseCallbackParams(search);

  expect(result).toEqual({
token: 'abc123',
state: null,
  });
});

test('should return null for all missing parameters', () => {
  const search = '?other=param';

  const result = parseCallbackParams(search);

  expect(result).toEqual({
token: null,
state: null,
  });
});

test('should handle empty query string', () => {
  const search = '';

  const result = parseCallbackParams(search);

  expect(result).toEqual({
token: null,
state: null,
  });
});

test('should handle malformed query strings', () => {
  const search = 'invalid-query-string';

  const result = parseCallbackParams(search);

  expect(result).toEqual({
token: null,
state: null,
  });
});

test('should handle URL encoded values', () => {
  const search = '?token=abc%20123&state=xyz%2B789';

  const result = parseCallbackParams(search);

  expect(result).toEqual({
token: 'abc 123',
state: 'xyz+789',
  });
});
  });

  describe('isAuthenticated', () => {
let storage: OAuthStorage;

beforeEach(() => {
  const adapter = new LocalStorageAdapter();
  storage = new OAuthStorage(adapter, 'test-app');
});

test('should return true when token and userData exist', () => {
  storage.storeToken('test-token');
  storage.storeUserData({
sub: 'user-123',
name: 'Test User',
given_name: 'Test',
family_name: 'User',
nickname: 'TestUser',
preferred_username: 'testuser',
iss: 'https://truename.example.com',
aud: 'test-app',
iat: 1692275400,
context_name: 'Test Context',
app_name: 'test-app',
  });

  const result = isAuthenticated(storage);

  expect(result).toBe(true);
});

test('should return false when token is missing', () => {
  storage.storeUserData({
sub: 'user-123',
name: 'Test User',
given_name: 'Test',
family_name: 'User',
nickname: 'TestUser',
preferred_username: 'testuser',
iss: 'https://truename.example.com',
aud: 'test-app',
iat: 1692275400,
context_name: 'Test Context',
app_name: 'test-app',
  });

  const result = isAuthenticated(storage);

  expect(result).toBe(false);
});

test('should return false when userData is missing', () => {
  storage.storeToken('test-token');

  const result = isAuthenticated(storage);

  expect(result).toBe(false);
});

test('should return false when both token and userData are missing', () => {
  const result = isAuthenticated(storage);

  expect(result).toBe(false);
});
  });

  describe('getAuthState', () => {
let storage: OAuthStorage;

beforeEach(() => {
  const adapter = new LocalStorageAdapter();
  storage = new OAuthStorage(adapter, 'test-app');
});

test('should return complete auth state when authenticated', () => {
  const token = 'test-token';
  const userData = {
sub: 'user-123',
name: 'Test User',
given_name: 'Test',
family_name: 'User',
nickname: 'TestUser',
preferred_username: 'testuser',
iss: 'https://truename.example.com',
aud: 'test-app',
iat: 1692275400,
context_name: 'Test Context',
app_name: 'test-app',
  };

  storage.storeToken(token);
  storage.storeUserData(userData);

  const result = getAuthState(storage);

  expect(result).toEqual({
isAuthenticated: true,
token: token,
userData: userData,
expiresAt: null,
  });
});

test('should return unauthenticated state when no token', () => {
  const userData = {
sub: 'user-123',
name: 'Test User',
given_name: 'Test',
family_name: 'User',
nickname: 'TestUser',
preferred_username: 'testuser',
iss: 'https://truename.example.com',
aud: 'test-app',
iat: 1692275400,
context_name: 'Test Context',
app_name: 'test-app',
  };
  storage.storeUserData(userData);

  const result = getAuthState(storage);

  expect(result).toEqual({
isAuthenticated: false,
token: null,
userData: userData,
expiresAt: null,
  });
});

test('should return unauthenticated state when no userData', () => {
  storage.storeToken('test-token');

  const result = getAuthState(storage);

  expect(result).toEqual({
isAuthenticated: false,
token: 'test-token',
userData: null,
expiresAt: null,
  });
});

test('should always return null for expiresAt', () => {
  const result = getAuthState(storage);

  expect(result.expiresAt).toBeNull();
});
  });

  describe('buildAuthUrl', () => {
test('should construct valid OAuth authorization URL', () => {
  const baseUrl = 'https://truename.example.com';
  const appName = 'demo-hr';
  const returnUrl = 'https://demo-hr.example.com/callback';
  const state = 'state-token-123';

  const result = buildAuthUrl(baseUrl, appName, returnUrl, state);

  expect(result).toBe(
'https://truename.example.com/auth/oauth-authorize?app_name=demo-hr&return_url=https%3A%2F%2Fdemo-hr.example.com%2Fcallback&state=state-token-123',
  );
});

test('should include all required parameters', () => {
  const result = buildAuthUrl(
'https://api.test.com',
'test-app',
'https://app.test.com/auth',
'test-state',
  );

  const url = new URL(result);

  expect(url.searchParams.get('app_name')).toBe('test-app');
  expect(url.searchParams.get('return_url')).toBe(
'https://app.test.com/auth',
  );
  expect(url.searchParams.get('state')).toBe('test-state');
});

test('should properly encode special characters in parameters', () => {
  const baseUrl = 'https://api.example.com';
  const appName = 'test app with spaces';
  const returnUrl =
'https://app.example.com/callback?extra=param&other=value';
  const state = 'state with spaces & symbols';

  const result = buildAuthUrl(baseUrl, appName, returnUrl, state);
  const url = new URL(result);

  expect(url.searchParams.get('app_name')).toBe('test app with spaces');
  expect(url.searchParams.get('return_url')).toBe(
'https://app.example.com/callback?extra=param&other=value',
  );
  expect(url.searchParams.get('state')).toBe('state with spaces & symbols');
});

test('should handle minimal valid base URL', () => {
  const result = buildAuthUrl('https://example.com', '', '', '');

  expect(result).toContain('https://example.com/auth/oauth-authorize');
  expect(result).toContain('app_name=');
  expect(result).toContain('return_url=');
  expect(result).toContain('state=');
});
  });
});
