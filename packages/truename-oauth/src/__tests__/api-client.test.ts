// API Client Tests

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { fetchClientInfo, resolveOIDCClaims } from '../api-client.js';
import { mockFetch } from '../../vitest.setup';
import type { ClientInfo, OIDCClaims } from '../types.js';

describe('API Client', () => {
  beforeEach(() => {
vi.clearAllMocks();
mockFetch.mockClear();
  });

  describe('fetchClientInfo', () => {
const apiBaseUrl = 'https://truename.example.com';
const appName = 'demo-hr';

test('should fetch client info successfully', async () => {
  const mockClientInfo: ClientInfo = {
client_id: 'demo-hr-client',
display_name: 'Demo HR Application',
app_name: 'demo-hr',
publisher_domain: 'demo-hr.example.com',
  };

  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: { client: mockClientInfo },
  requestId: 'req-123',
  timestamp: '2025-08-27T12:00:00Z',
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo(apiBaseUrl, appName);

  expect(mockFetch).toHaveBeenCalledWith(
`${apiBaseUrl}/api/oauth/apps/${appName}`,
{
  method: 'GET',
  headers: {
'Content-Type': 'application/json',
'Origin': 'https://demo-hr.example.com',
  },
},
  );

  expect(result.success).toBe(true);
  if (result.success) {
expect(result.data).toEqual(mockClientInfo);
  }
});

test('should handle HTTP errors', async () => {
  const mockResponse = {
ok: false,
status: 404,
statusText: 'Not Found',
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo(apiBaseUrl, appName);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('failed_to_fetch_client_info');
expect(result.message).toBe('HTTP 404: Not Found');
  }
});

test('should handle different HTTP error codes', async () => {
  const mockResponse = {
ok: false,
status: 500,
statusText: 'Internal Server Error',
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo(apiBaseUrl, appName);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('failed_to_fetch_client_info');
expect(result.message).toBe('HTTP 500: Internal Server Error');
  }
});

test('should handle network errors', async () => {
  const networkError = new Error('Network connection failed');
  mockFetch.mockRejectedValue(networkError);

  const result = await fetchClientInfo(apiBaseUrl, appName);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('network_error');
expect(result.message).toBe('Network connection failed');
  }
});

test('should handle network errors without message', async () => {
  mockFetch.mockRejectedValue('string error');

  const result = await fetchClientInfo(apiBaseUrl, appName);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('network_error');
expect(result.message).toBe('Network request failed');
  }
});

test('should handle JSend failure responses', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: false,
  error: {
code: 'invalid_app',
message: 'Application not found',
  },
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo(apiBaseUrl, appName);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('invalid_app');
expect(result.message).toBe('Application not found');
  }
});

test('should handle JSend failure without error details', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: false,
  message: 'Generic failure message',
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo(apiBaseUrl, appName);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('unknown_error');
expect(result.message).toBe('Generic failure message');
  }
});

test('should handle malformed JSend responses', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: false,
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo(apiBaseUrl, appName);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('unknown_error');
expect(result.message).toBe('API request failed');
  }
});

test('should include proper headers', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: { client: {} },
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  await fetchClientInfo(apiBaseUrl, appName);

  expect(mockFetch).toHaveBeenCalledWith(
expect.any(String),
expect.objectContaining({
  headers: {
'Content-Type': 'application/json',
'Origin': 'https://demo-hr.example.com',
  },
}),
  );
});
  });

  describe('resolveOIDCClaims', () => {
const apiBaseUrl = 'https://truename.example.com';
const token = 'bearer-token-123';

test('should resolve OIDC claims successfully', async () => {
  const mockClaims: OIDCClaims = {
sub: 'user-456',
name: 'John Doe',
given_name: 'John',
family_name: 'Doe',
nickname: 'Johnny',
preferred_username: 'johndoe',
iss: 'https://truename.example.com',
aud: 'demo-hr',
iat: 1692275400,
context_name: 'Work Colleagues',
app_name: 'demo-hr',
  };

  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: { claims: mockClaims },
  requestId: 'req-456',
  timestamp: '2025-08-27T12:05:00Z',
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await resolveOIDCClaims(apiBaseUrl, token);

  expect(mockFetch).toHaveBeenCalledWith(
`${apiBaseUrl}/api/oauth/resolve`,
{
  method: 'POST',
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
},
  );

  expect(result.success).toBe(true);
  if (result.success) {
expect(result.data).toEqual(mockClaims);
  }
});

test('should handle unauthorized errors (401)', async () => {
  const mockResponse = {
ok: false,
status: 401,
statusText: 'Unauthorized',
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await resolveOIDCClaims(apiBaseUrl, token);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('invalid_token');
expect(result.message).toBe('HTTP 401: Unauthorized');
  }
});

test('should handle other HTTP errors as resolution_failed', async () => {
  const mockResponse = {
ok: false,
status: 500,
statusText: 'Internal Server Error',
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await resolveOIDCClaims(apiBaseUrl, token);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('resolution_failed');
expect(result.message).toBe('HTTP 500: Internal Server Error');
  }
});

test('should handle network errors', async () => {
  const networkError = new Error('Request timeout');
  mockFetch.mockRejectedValue(networkError);

  const result = await resolveOIDCClaims(apiBaseUrl, token);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('network_error');
expect(result.message).toBe('Request timeout');
  }
});

test('should include Bearer token in Authorization header', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: { claims: {} },
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  await resolveOIDCClaims(apiBaseUrl, 'test-token-456');

  expect(mockFetch).toHaveBeenCalledWith(
expect.any(String),
expect.objectContaining({
  headers: expect.objectContaining({
Authorization: 'Bearer test-token-456',
  }),
}),
  );
});

test('should handle JSend failure responses', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: false,
  error: {
code: 'insufficient_scope',
message: 'Token lacks required permissions',
  },
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await resolveOIDCClaims(apiBaseUrl, token);

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('insufficient_scope');
expect(result.message).toBe('Token lacks required permissions');
  }
});
  });

  describe('error handling utilities', () => {
test('should handle JSON parsing errors', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo('https://api.test.com', 'test-app');

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('network_error');
expect(result.message).toBe('Invalid JSON');
  }
});

test('should handle empty responses', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo('https://api.test.com', 'test-app');

  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('unknown_error');
expect(result.message).toBe('API request failed');
  }
});

test('should handle malformed success responses', async () => {
  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  // Missing data property - will throw when trying to access nested client
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo('https://api.test.com', 'test-app');

  // This will actually fail because it can't access r.data.client on undefined
  expect(result.success).toBe(false);
  if (!result.success) {
expect(result.error).toBe('network_error');
  }
});
  });

  describe('integration scenarios', () => {
test('should work with real-world response structures', async () => {
  const realClientInfo: ClientInfo = {
client_id: 'hr-dashboard-2024',
display_name: 'HR Management Dashboard',
app_name: 'hr-dashboard',
publisher_domain: 'hr-dashboard.company.com',
  };

  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: {
client: realClientInfo,
metadata: {
  created_at: '2025-01-15T10:30:00Z',
  last_used: '2025-08-27T11:45:00Z',
},
  },
  requestId: 'req_hr_fetch_789',
  timestamp: '2025-08-27T12:00:00Z',
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await fetchClientInfo(
'https://truename-api.company.com',
'hr-dashboard',
  );

  expect(result.success).toBe(true);
  if (result.success) {
expect(result.data.client_id).toBe('hr-dashboard-2024');
expect(result.data.display_name).toBe('HR Management Dashboard');
expect(result.data.app_name).toBe('hr-dashboard');
  }
});

test('should handle complete OAuth resolution flow', async () => {
  const fullClaims: OIDCClaims = {
sub: 'emp_12345',
name: 'Jane Smith',
given_name: 'Jane',
family_name: 'Smith',
nickname: 'Janie',
preferred_username: 'jsmith',
iss: 'https://api.truename.com',
aud: 'hr-dashboard',
iat: 1692275400,
context_name: 'HR Team Members',
app_name: 'hr-dashboard',
  };

  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: {
claims: fullClaims,
context: {
  resolved_from: 'context_assignment',
  context_name: 'HR Team Members',
  consent_granted: true,
},
  },
  requestId: 'req_resolve_456',
  timestamp: '2025-08-27T12:10:00Z',
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await resolveOIDCClaims(
'https://api.truename.com',
'jwt_token_789',
  );

  expect(result.success).toBe(true);
  if (result.success) {
expect(result.data.sub).toBe('emp_12345');
expect(result.data.context_name).toBe('HR Team Members');
expect(result.data.iat).toBe(1692275400);
  }
});
  });
});
