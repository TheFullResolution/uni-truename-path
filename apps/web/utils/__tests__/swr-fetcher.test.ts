// TrueNamePath: SWR Fetcher Unit Tests
// Date: August 19, 2025
// Comprehensive test suite for SWR data fetching utilities

import {
  describe,
  test,
  expect,
  beforeEach,
  vi,
  afterEach,
  type MockedFunction,
} from 'vitest';
import {
  swrFetcher,
  createMutationFetcher,
  formatSWRError,
} from '../swr-fetcher';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Types for testing
interface TestData {
  id: string;
  name: string;
}

interface TestRequestBody {
  name: string;
  category: string;
}

describe('SWR Fetcher Utilities', () => {
  beforeEach(() => {
vi.clearAllMocks();
  });

  afterEach(() => {
vi.restoreAllMocks();
  });

  describe('swrFetcher', () => {
test('should fetch data successfully with correct configuration', async () => {
  const mockData = { id: '1', name: 'Test Item' };
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: mockData,
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await swrFetcher<TestData>('/api/test');

  expect(mockFetch).toHaveBeenCalledWith('/api/test', {
method: 'GET',
headers: {
  'Content-Type': 'application/json',
},
credentials: 'include',
  });

  expect(result).toEqual(mockData);
});

test('should include cookies for authentication', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: {},
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  await swrFetcher('/api/protected');

  expect(mockFetch).toHaveBeenCalledWith(
'/api/protected',
expect.objectContaining({
  credentials: 'include',
}),
  );
});

test('should throw error for HTTP error responses', async () => {
  const mockResponse = {
ok: false,
status: 404,
text: vi.fn().mockResolvedValue('Not Found'),
  };

  mockFetch.mockResolvedValue(mockResponse);

  await expect(swrFetcher('/api/nonexistent')).rejects.toThrow(
'HTTP 404: Not Found',
  );
});

test('should handle JSend failure responses', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: false,
  message: 'Validation failed',
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  await expect(swrFetcher('/api/invalid')).rejects.toThrow(
'Validation failed',
  );
});

test('should handle JSend failure without message', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: false,
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  await expect(swrFetcher('/api/failure')).rejects.toThrow(
'API request failed',
  );
});

test('should return typed data from successful JSend response', async () => {
  const mockData: TestData = { id: 'test-123', name: 'Test User' };
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: mockData,
  requestId: 'req_123',
  timestamp: '2025-08-19T12:00:00Z',
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await swrFetcher<TestData>('/api/user');

  expect(result).toEqual(mockData);
  expect(result.id).toBe('test-123');
  expect(result.name).toBe('Test User');
});

test('should handle network errors', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));

  await expect(swrFetcher('/api/test')).rejects.toThrow('Network error');
});

test('should handle malformed JSON responses', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
  };

  mockFetch.mockResolvedValue(mockResponse);

  await expect(swrFetcher('/api/malformed')).rejects.toThrow(
'Invalid JSON',
  );
});

test('should handle successful response with null data', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: null,
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await swrFetcher('/api/empty');

  expect(result).toBeNull();
});

test('should handle successful response with undefined data', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: undefined,
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await swrFetcher('/api/undefined');

  expect(result).toBeUndefined();
});
  });

  describe('createMutationFetcher', () => {
describe('POST requests', () => {
  test('should create POST fetcher with correct configuration', async () => {
const mockResponseData = { id: 'new-123', name: 'Created Item' };
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: true,
data: mockResponseData,
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const postFetcher = createMutationFetcher<TestData, TestRequestBody>(
  'POST',
);
const requestBody = { name: 'New Item', category: 'test' };

const result = await postFetcher('/api/items', { arg: requestBody });

expect(mockFetch).toHaveBeenCalledWith('/api/items', {
  method: 'POST',
  headers: {
'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(requestBody),
});

expect(result).toEqual(mockResponseData);
  });

  test('should default to POST method', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: true,
data: {},
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const fetcher = createMutationFetcher();
await fetcher('/api/default', { arg: { test: true } });

expect(mockFetch).toHaveBeenCalledWith(
  '/api/default',
  expect.objectContaining({
method: 'POST',
  }),
);
  });

  test('should handle requests without body', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: true,
data: {},
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const postFetcher = createMutationFetcher('POST');
await postFetcher('/api/no-body', {});

expect(mockFetch).toHaveBeenCalledWith(
  '/api/no-body',
  expect.objectContaining({
body: undefined,
  }),
);
  });
});

describe('PUT requests', () => {
  test('should create PUT fetcher with correct configuration', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: true,
data: { id: 'updated-123' },
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const putFetcher = createMutationFetcher<TestData, TestRequestBody>(
  'PUT',
);
const updateData = { name: 'Updated Item', category: 'modified' };

await putFetcher('/api/items/123', { arg: updateData });

expect(mockFetch).toHaveBeenCalledWith('/api/items/123', {
  method: 'PUT',
  headers: {
'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(updateData),
});
  });
});

describe('DELETE requests', () => {
  test('should create DELETE fetcher with correct configuration', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: true,
data: { deleted: true },
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const deleteFetcher = createMutationFetcher('DELETE');
await deleteFetcher('/api/items/123', {});

expect(mockFetch).toHaveBeenCalledWith('/api/items/123', {
  method: 'DELETE',
  headers: {
'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: undefined,
});
  });

  test('should handle DELETE with body data', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: true,
data: {},
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const deleteFetcher = createMutationFetcher('DELETE');
const deleteParams = { reason: 'cleanup' };

await deleteFetcher('/api/items/bulk', { arg: deleteParams });

expect(mockFetch).toHaveBeenCalledWith(
  '/api/items/bulk',
  expect.objectContaining({
body: JSON.stringify(deleteParams),
  }),
);
  });
});

describe('Error handling', () => {
  test('should throw error for HTTP error responses', async () => {
const mockResponse = {
  ok: false,
  status: 400,
  text: vi.fn().mockResolvedValue('Bad Request'),
};

mockFetch.mockResolvedValue(mockResponse);

const postFetcher = createMutationFetcher('POST');

await expect(
  postFetcher('/api/invalid', { arg: { invalid: true } }),
).rejects.toThrow('HTTP 400: Bad Request');
  });

  test('should handle JSend failure responses with custom error message', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: false,
message: 'Custom validation error',
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const putFetcher = createMutationFetcher('PUT');

await expect(
  putFetcher('/api/validate', { arg: { data: 'invalid' } }),
).rejects.toThrow('Custom validation error');
  });

  test('should provide default error message for JSend failures', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: false,
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const deleteFetcher = createMutationFetcher('DELETE');

await expect(deleteFetcher('/api/items/123', {})).rejects.toThrow(
  'DELETE request failed',
);
  });
});

describe('Authentication and cookies', () => {
  test('should include credentials for cookie-based auth', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: true,
data: {},
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const postFetcher = createMutationFetcher('POST');
await postFetcher('/api/protected', { arg: { data: 'test' } });

expect(mockFetch).toHaveBeenCalledWith(
  '/api/protected',
  expect.objectContaining({
credentials: 'include',
  }),
);
  });

  test('should not include Authorization headers (cookie-based auth)', async () => {
const mockResponse = {
  ok: true,
  json: vi.fn().mockResolvedValue({
success: true,
data: {},
  }),
};

mockFetch.mockResolvedValue(mockResponse);

const postFetcher = createMutationFetcher('POST');
await postFetcher('/api/auth-test', { arg: { data: 'test' } });

const fetchCall = mockFetch.mock.calls[0];
const headers = fetchCall[1].headers;

expect(headers).not.toHaveProperty('Authorization');
expect(headers).not.toHaveProperty('authorization');
  });
});
  });

  describe('formatSWRError', () => {
test('should handle string errors', () => {
  const errorMessage = 'Simple error message';
  const result = formatSWRError(errorMessage);
  expect(result).toBe(errorMessage);
});

test('should handle Error objects', () => {
  const error = new Error('Test error');
  const result = formatSWRError(error);
  expect(result).toBe('Test error');
});

test('should handle objects with message property', () => {
  const error = { message: 'Object error message' };
  const result = formatSWRError(error);
  expect(result).toBe('Object error message');
});

test('should handle axios-style error objects', () => {
  const error = {
response: {
  data: {
message: 'API error message',
  },
},
  };
  const result = formatSWRError(error);
  expect(result).toBe('API error message');
});

test('should handle null and undefined', () => {
  expect(formatSWRError(null)).toBe('Unknown error occurred');
  expect(formatSWRError(undefined)).toBe('Unknown error occurred');
});

test('should handle empty objects', () => {
  const result = formatSWRError({});
  expect(result).toBe('An error occurred while processing your request');
});

test('should handle objects without proper structure', () => {
  const error = { random: 'property' };
  const result = formatSWRError(error);
  expect(result).toBe('An error occurred while processing your request');
});

test('should handle nested objects without message', () => {
  const error = {
response: {
  data: {
error: 'No message property',
  },
},
  };
  const result = formatSWRError(error);
  expect(result).toBe('An error occurred while processing your request');
});

test('should handle non-string message properties', () => {
  const error = { message: 123 };
  const result = formatSWRError(error);
  expect(result).toBe('An error occurred while processing your request');
});

test('should handle complex nested error structures', () => {
  const error = {
name: 'ValidationError',
message: 'Validation failed',
details: {
  field: 'email',
  code: 'INVALID_FORMAT',
},
  };
  const result = formatSWRError(error);
  expect(result).toBe('Validation failed');
});

test('should preserve error message formatting', () => {
  const errorMessage = 'HTTP 400: Bad Request - Invalid data format';
  const result = formatSWRError(errorMessage);
  expect(result).toBe(errorMessage);
});
  });

  describe('Type Safety', () => {
test('should preserve type information in swrFetcher', async () => {
  interface UserData {
id: string;
email: string;
profile: {
  fullName: string;
};
  }

  const mockUserData: UserData = {
id: 'user-123',
email: 'test@example.com',
profile: {
  fullName: 'Test User',
},
  };

  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: mockUserData,
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await swrFetcher<UserData>('/api/user');

  // TypeScript should ensure these properties exist
  expect(result.id).toBe('user-123');
  expect(result.email).toBe('test@example.com');
  expect(result.profile.fullName).toBe('Test User');
});

test('should preserve type information in mutation fetchers', async () => {
  interface CreateNameRequest {
nameText: string;
nameType: string;
  }

  interface NameResponse {
id: string;
nameText: string;
isPreferred: boolean;
  }

  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: {
id: 'name-123',
nameText: 'John Doe',
isPreferred: true,
  },
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const createName = createMutationFetcher<NameResponse, CreateNameRequest>(
'POST',
  );
  const result = await createName('/api/names', {
arg: {
  nameText: 'John Doe',
  nameType: 'PREFERRED',
},
  });

  // TypeScript should ensure these properties exist and have correct types
  expect(result.id).toBe('name-123');
  expect(result.nameText).toBe('John Doe');
  expect(result.isPreferred).toBe(true);
});
  });
});
