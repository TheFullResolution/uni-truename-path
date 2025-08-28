/**
 * Authentication Utilities for OAuth Flow
 * Academic constraint: Each function ≤15 lines
 */

import type { AuthState } from './types.js';
import type { OAuthStorage } from './storage.js';

export function generateStateToken(): string {
  return crypto.randomUUID();
}

export function validateStateToken(
  expectedState: string,
  receivedState: string,
): boolean {
  return expectedState === receivedState;
}

export function parseCallbackParams(search: string): {
  token: string | null;
  state: string | null;
} {
  const params = new URLSearchParams(search);
  return {
token: params.get('token'),
state: params.get('state'),
  };
}

export function isAuthenticated(storage: OAuthStorage): boolean {
  const token = storage.getToken();
  const userData = storage.getUserData();
  return token !== null && userData !== null;
}

export function getAuthState(storage: OAuthStorage): AuthState {
  const token = storage.getToken();
  const userData = storage.getUserData();
  return {
isAuthenticated: token !== null && userData !== null,
token,
userData,
expiresAt: null, // Academic simplification - 2h tokens sufficient for demos
  };
}

export function buildAuthUrl(
  baseUrl: string,
  appName: string,
  returnUrl: string,
  state: string,
): string {
  const params = new URLSearchParams({
app_name: appName,
return_url: returnUrl,
state,
  });
  return `${baseUrl}/auth/oauth-authorize?${params.toString()}`;
}
