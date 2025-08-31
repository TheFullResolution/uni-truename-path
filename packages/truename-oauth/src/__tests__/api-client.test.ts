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
// Mandatory OIDC claims
sub: 'user-456',
iss: 'https://truenameapi.demo',
aud: 'demo-hr',
iat: 1692275400,
exp: 1692279000, // iat + 3600
nbf: 1692275400, // same as iat
jti: '550e8400-e29b-41d4-a716-446655440000', // valid UUID

// Optional standard OIDC claims
name: 'John Doe',
given_name: 'John',
family_name: 'Doe',
nickname: 'Johnny',
preferred_username: 'johndoe',
email: 'john.doe@test.com',
email_verified: true,
updated_at: 1692275400,
locale: 'en-GB',
zoneinfo: 'Europe/London',

// TrueNamePath-specific claims
context_name: 'Work Colleagues',
app_name: 'demo-hr',

// Academic transparency claims
_token_type: 'bearer_demo',
_note: 'Bearer token - claims informational only',
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
// Mandatory OIDC claims
sub: 'emp_12345',
iss: 'https://truenameapi.demo',
aud: 'hr-dashboard',
iat: 1692275400,
exp: 1692279000, // iat + 3600
nbf: 1692275400, // same as iat
jti: '123e4567-e89b-12d3-a456-426614174000', // valid UUID

// Optional standard OIDC claims
name: 'Jane Smith',
given_name: 'Jane',
family_name: 'Smith',
nickname: 'Janie',
preferred_username: 'jsmith',
email: 'jane.smith@company.com',
email_verified: true,
updated_at: 1692275400,
locale: 'en-GB',
zoneinfo: 'Europe/London',

// TrueNamePath-specific claims
context_name: 'HR Team Members',
app_name: 'hr-dashboard',

// Academic transparency claims
_token_type: 'bearer_demo',
_note: 'Bearer token - claims informational only',
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

// Verify mandatory OIDC claims are present
expect(result.data.iss).toBeDefined();
expect(result.data.aud).toBeDefined();
expect(result.data.exp).toBeDefined();
expect(result.data.nbf).toBeDefined();
expect(result.data.jti).toBeDefined();

// Verify time relationships
expect(result.data.exp).toBe(result.data.iat + 3600);
expect(result.data.nbf).toBe(result.data.iat);

// Verify UK defaults
expect(result.data.locale).toBe('en-GB');
expect(result.data.zoneinfo).toBe('Europe/London');

// Verify academic transparency claims
expect(result.data._token_type).toBe('bearer_demo');
expect(result.data._note).toBeDefined();
  }
});

test('should validate OIDC claims structure in resolved data', async () => {
  const enhancedClaims: OIDCClaims = {
// All mandatory claims
sub: 'user_789',
iss: 'https://truenameapi.demo',
aud: 'test-app',
iat: 1692275400,
exp: 1692279000,
nbf: 1692275400,
jti: '456e7890-e12c-34d5-a678-901234567890',

// Standard optional claims
email: 'user@test.com',
email_verified: false,
locale: 'en-GB',
zoneinfo: 'Europe/London',

// Required TrueNamePath claims
context_name: 'Test Context',
app_name: 'test-app',

// Academic claims
_token_type: 'bearer_demo',
_note: 'Bearer token - claims informational only',
  };

  const mockResponse = {
ok: true,
json: vi.fn().mockResolvedValue({
  success: true,
  data: { claims: enhancedClaims },
}),
  };

  mockFetch.mockResolvedValue(mockResponse);

  const result = await resolveOIDCClaims(
'https://api.test.com',
'test-token',
  );

  expect(result.success).toBe(true);
  if (result.success) {
const claims = result.data;

// Verify all mandatory OIDC claims
expect(claims.sub).toBe('user_789');
expect(claims.iss).toBe('https://truenameapi.demo');
expect(claims.aud).toBe('test-app');
expect(claims.iat).toBe(1692275400);
expect(claims.exp).toBe(1692279000);
expect(claims.nbf).toBe(1692275400);
expect(claims.jti).toBe('456e7890-e12c-34d5-a678-901234567890');

// Verify time relationships
expect(claims.exp).toBe(claims.iat + 3600);
expect(claims.nbf).toBe(claims.iat);

// Verify UUID format for jti
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
expect(claims.jti).toMatch(uuidRegex);

// Verify email verification is boolean
expect(typeof claims.email_verified).toBe('boolean');
expect(claims.email_verified).toBe(false);

// Verify UK defaults
expect(claims.locale).toBe('en-GB');
expect(claims.zoneinfo).toBe('Europe/London');

// Verify academic transparency claims
expect(claims._token_type).toBe('bearer_demo');
expect(claims._note).toBe('Bearer token - claims informational only');
  }
});
  });
});
