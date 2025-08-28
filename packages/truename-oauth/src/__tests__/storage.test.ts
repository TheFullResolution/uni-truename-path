// TrueNamePath OAuth Client Library: Storage Unit Tests
// Date: August 27, 2025
// Comprehensive test suite for storage adapters and OAuth storage

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LocalStorageAdapter, OAuthStorage } from '../storage.js';
import { localStorageMock } from '../../vitest.setup';
import type { OIDCClaims } from '../types.js';

describe('Storage', () => {
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

  describe('LocalStorageAdapter', () => {
let adapter: LocalStorageAdapter;

beforeEach(() => {
  adapter = new LocalStorageAdapter();
});

describe('getItem', () => {
  test('should get item from localStorage', () => {
// Store item using localStorage to ensure it goes through the mock
localStorage.setItem('test-key', 'test-value');

const result = adapter.getItem('test-key');

expect(result).toBe('test-value');
expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  test('should return null for non-existent key', () => {
const result = adapter.getItem('non-existent');

expect(result).toBeNull();
expect(localStorageMock.getItem).toHaveBeenCalledWith('non-existent');
  });

  test('should handle localStorage errors gracefully', () => {
localStorageMock.getItem.mockImplementation(() => {
  throw new Error('LocalStorage error');
});

const result = adapter.getItem('error-key');

expect(result).toBeNull();
  });
});

describe('setItem', () => {
  test('should set item in localStorage', () => {
adapter.setItem('test-key', 'test-value');

expect(localStorageMock.setItem).toHaveBeenCalledWith(
  'test-key',
  'test-value',
);
// Verify it was actually stored by retrieving it
expect(localStorage.getItem('test-key')).toBe('test-value');
  });

  test('should handle localStorage errors gracefully', () => {
localStorageMock.setItem.mockImplementation(() => {
  throw new Error('LocalStorage error');
});

expect(() => adapter.setItem('error-key', 'error-value')).not.toThrow();
  });
});

describe('removeItem', () => {
  test('should remove item from localStorage', () => {
// First set an item
localStorage.setItem('test-key', 'test-value');

adapter.removeItem('test-key');

expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
expect(localStorage.getItem('test-key')).toBeNull();
  });

  test('should handle localStorage errors gracefully', () => {
localStorageMock.removeItem.mockImplementation(() => {
  throw new Error('LocalStorage error');
});

expect(() => adapter.removeItem('error-key')).not.toThrow();
  });
});

describe('clear', () => {
  test('should clear all items from localStorage', () => {
localStorage.setItem('key1', 'value1');
localStorage.setItem('key2', 'value2');

adapter.clear();

expect(localStorageMock.clear).toHaveBeenCalled();
// Verify items were cleared
expect(localStorage.getItem('key1')).toBeNull();
expect(localStorage.getItem('key2')).toBeNull();
  });

  test('should handle localStorage errors gracefully', () => {
localStorageMock.clear.mockImplementation(() => {
  throw new Error('LocalStorage error');
});

expect(() => adapter.clear()).not.toThrow();
  });
});
  });

  describe('OAuthStorage', () => {
let adapter: LocalStorageAdapter;
let storage: OAuthStorage;

beforeEach(() => {
  adapter = new LocalStorageAdapter();
  storage = new OAuthStorage(adapter, 'test-app');
});

describe('constructor', () => {
  test('should initialize with app-specific key prefix', () => {
const testStorage = new OAuthStorage(adapter, 'my-app');

testStorage.storeToken('test-token');

expect(localStorageMock.setItem).toHaveBeenCalledWith(
  'truename_oauth_my-app_token',
  'test-token',
);
  });
});

describe('token management', () => {
  test('should store token with prefix and timestamp', () => {
const token = 'test-access-token';
const mockNow = 1692275400000;
vi.spyOn(Date, 'now').mockReturnValue(mockNow);

storage.storeToken(token);

expect(localStorageMock.setItem).toHaveBeenCalledWith(
  'truename_oauth_test-app_token',
  token,
);
expect(localStorageMock.setItem).toHaveBeenCalledWith(
  'truename_oauth_test-app_expires',
  mockNow.toString(),
);
  });

  test('should retrieve stored token', () => {
// Store token through the adapter to ensure the mock is set up correctly
storage.storeToken('stored-token');

const result = storage.getToken();

expect(result).toBe('stored-token');
  });

  test('should return null for non-existent token', () => {
const result = storage.getToken();

expect(result).toBeNull();
  });
});

describe('user data management', () => {
  test('should store user data as JSON', () => {
const userData: OIDCClaims = {
  sub: 'user-123',
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  nickname: 'Tester',
  preferred_username: 'testuser',
  iss: 'https://truename.example.com',
  aud: 'test-app',
  iat: 1692275400,
  context_name: 'Test Context',
  app_name: 'test-app',
};

storage.storeUserData(userData);

expect(localStorageMock.setItem).toHaveBeenCalledWith(
  'truename_oauth_test-app_user',
  JSON.stringify(userData),
);
  });

  test('should retrieve and parse stored user data', () => {
const userData: OIDCClaims = {
  sub: 'user-456',
  name: 'Another User',
  given_name: 'Another',
  family_name: 'User',
  nickname: 'Anon',
  preferred_username: 'anotheruser',
  iss: 'https://truename.example.com',
  aud: 'test-app',
  iat: 1692275500,
  context_name: 'Another Context',
  app_name: 'test-app',
};

// Store through the adapter to ensure the mock works correctly
storage.storeUserData(userData);

const result = storage.getUserData();

expect(result).toEqual(userData);
  });

  test('should return null for non-existent user data', () => {
const result = storage.getUserData();

expect(result).toBeNull();
  });

  test('should handle JSON parse errors gracefully', () => {
// Directly set invalid JSON in localStorage
localStorage.setItem('truename_oauth_test-app_user', 'invalid-json');

const result = storage.getUserData();

expect(result).toBeNull();
  });

  test('should handle empty string gracefully', () => {
// Directly set empty string in localStorage
localStorage.setItem('truename_oauth_test-app_user', '');

const result = storage.getUserData();

expect(result).toBeNull();
  });
});

describe('state management', () => {
  test('should store state token', () => {
const state = 'csrf-protection-token';

storage.storeState(state);

expect(localStorageMock.setItem).toHaveBeenCalledWith(
  'truename_oauth_test-app_state',
  state,
);
  });

  test('should retrieve stored state', () => {
// Store through the adapter to ensure the mock works correctly
storage.storeState('stored-state');

const result = storage.getState();

expect(result).toBe('stored-state');
  });

  test('should return null for non-existent state', () => {
const result = storage.getState();

expect(result).toBeNull();
  });
});

describe('clearAll', () => {
  test('should clear all OAuth-related data', () => {
const appPrefix = 'truename_oauth_test-app';

// Set up test data using localStorage methods
localStorage.setItem(`${appPrefix}_token`, 'token');
localStorage.setItem(`${appPrefix}_user`, 'user-data');
localStorage.setItem(`${appPrefix}_state`, 'state');
localStorage.setItem(`${appPrefix}_expires`, 'expires');
localStorage.setItem('other_key', 'should-remain');

storage.clearAll();

expect(localStorageMock.removeItem).toHaveBeenCalledWith(
  `${appPrefix}_token`,
);
expect(localStorageMock.removeItem).toHaveBeenCalledWith(
  `${appPrefix}_user`,
);
expect(localStorageMock.removeItem).toHaveBeenCalledWith(
  `${appPrefix}_state`,
);
expect(localStorageMock.removeItem).toHaveBeenCalledWith(
  `${appPrefix}_expires`,
);
expect(localStorageMock.removeItem).toHaveBeenCalledTimes(4);

// Verify other key remains
expect(localStorage.getItem('other_key')).toBe('should-remain');
  });

  test('should work even when no data exists', () => {
storage.clearAll();

expect(localStorageMock.removeItem).toHaveBeenCalledTimes(4);
  });
});

describe('integration scenarios', () => {
  test('should handle complete OAuth flow data lifecycle', () => {
const token = 'access-token-123';
const userData: OIDCClaims = {
  sub: 'user-789',
  name: 'Integration Test User',
  given_name: 'Integration',
  family_name: 'User',
  nickname: 'IntegrationTest',
  preferred_username: 'integrationuser',
  iss: 'https://truename.example.com',
  aud: 'test-app',
  iat: 1692275600,
  context_name: 'Integration Context',
  app_name: 'test-app',
};
const state = 'integration-state-token';

// Store all data
storage.storeToken(token);
storage.storeUserData(userData);
storage.storeState(state);

// Verify all data can be retrieved
expect(storage.getToken()).toBe(token);
expect(storage.getUserData()).toEqual(userData);
expect(storage.getState()).toBe(state);

// Clear all and verify cleanup
storage.clearAll();
expect(storage.getToken()).toBeNull();
expect(storage.getUserData()).toBeNull();
expect(storage.getState()).toBeNull();
  });

  test('should maintain isolation between different app instances', () => {
const app1Storage = new OAuthStorage(adapter, 'app1');
const app2Storage = new OAuthStorage(adapter, 'app2');

app1Storage.storeToken('app1-token');
app2Storage.storeToken('app2-token');

expect(app1Storage.getToken()).toBe('app1-token');
expect(app2Storage.getToken()).toBe('app2-token');

app1Storage.clearAll();
expect(app1Storage.getToken()).toBeNull();
expect(app2Storage.getToken()).toBe('app2-token');
  });
});
  });
});
