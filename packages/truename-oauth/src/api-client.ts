// API Client Functions for OAuth Integration

import type { ClientInfo, OIDCClaims, ApiResponse } from './types.js';

function createNetworkError(error: unknown): ApiResponse<never> {
  return {
success: false,
error: 'network_error',
message: error instanceof Error ? error.message : 'Network request failed',
  };
}

function createHttpError(
  status: number,
  statusText: string,
  errorType: string,
): ApiResponse<never> {
  return {
success: false,
error: errorType,
message: `HTTP ${status}: ${statusText}`,
  };
}

function parseApiResponse<T>(
  result: unknown,
  dataExtractor: (result: unknown) => T,
): ApiResponse<T> {
  const apiResult = result as {
success?: boolean;
error?: { code?: string; message?: string };
message?: string;
  };
  if (apiResult.success === true) {
return { success: true, data: dataExtractor(result) };
  }
  return {
success: false,
error: apiResult.error?.code || 'unknown_error',
message:
  apiResult.error?.message || apiResult.message || 'API request failed',
  };
}

export async function fetchClientInfo(
  apiBaseUrl: string,
  appName: string,
): Promise<ApiResponse<ClientInfo>> {
  try {
const response = await fetch(`${apiBaseUrl}/api/oauth/apps/${appName}`, {
  method: 'GET',
  headers: {
'Content-Type': 'application/json',
'Origin': window.location.origin,
  },
});

if (!response.ok) {
  return createHttpError(
response.status,
response.statusText,
'failed_to_fetch_client_info',
  );
}

const result = await response.json();
return parseApiResponse(
  result,
  (r) => (r as { data: { client: ClientInfo } }).data.client,
);
  } catch (error) {
return createNetworkError(error);
  }
}

export async function resolveOIDCClaims(
  apiBaseUrl: string,
  token: string,
): Promise<ApiResponse<OIDCClaims>> {
  try {
const response = await fetch(`${apiBaseUrl}/api/oauth/resolve`, {
  method: 'POST',
  headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
  },
});

if (!response.ok) {
  const errorType =
response.status === 401 ? 'invalid_token' : 'resolution_failed';
  return createHttpError(response.status, response.statusText, errorType);
}

const result = await response.json();
return parseApiResponse(
  result,
  (r) => (r as { data: { claims: OIDCClaims } }).data.claims,
);
  } catch (error) {
return createNetworkError(error);
  }
}
