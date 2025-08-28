/**
 * TrueNamePath OAuth Client - Main Integration Class
 * Academic constraint: Each method ≤30 lines
 */

import type {
  OAuthConfig,
  ClientInfo,
  OIDCClaims,
  AuthState,
  ApiResponse,
} from './types.js';
import { OAuthStorage, LocalStorageAdapter } from './storage.js';
import {
  generateStateToken,
  validateStateToken,
  parseCallbackParams,
  isAuthenticated,
  getAuthState,
  buildAuthUrl,
} from './auth-utils.js';
import { fetchClientInfo, resolveOIDCClaims } from './api-client.js';

export class TrueNameOAuthClient {
  private config: OAuthConfig;
  private storage: OAuthStorage;
  private clientInfoCache: ClientInfo | null = null;

  constructor(config: OAuthConfig) {
this.config = config;
this.storage = new OAuthStorage(new LocalStorageAdapter(), config.appName);
  }

  async getClientInfo(): Promise<ApiResponse<ClientInfo>> {
if (this.clientInfoCache) {
  return { success: true, data: this.clientInfoCache };
}

const result = await fetchClientInfo(
  this.config.apiBaseUrl,
  this.config.appName,
);
if (result.success && result.data) {
  this.clientInfoCache = result.data;
}
return result;
  }

  async initiateAuthFlow(): Promise<ApiResponse<void>> {
const clientResult = await this.getClientInfo();
if (!clientResult.success || !clientResult.data) {
  return {
success: false,
error: 'client_info_failed',
message: clientResult.message || 'Failed to get client information',
  };
}

const state = generateStateToken();
this.storage.storeState(state);

const authUrl = buildAuthUrl(
  this.config.apiBaseUrl,
  this.config.appName,
  this.config.callbackUrl,
  state,
);

window.location.href = authUrl;
return { success: true, data: undefined };
  }

  async handleCallback(urlParams: string): Promise<ApiResponse<OIDCClaims>> {
const { token, state } = parseCallbackParams(urlParams);

if (!token) {
  return {
success: false,
error: 'missing_token',
message: 'No token in callback',
  };
}

if (!state) {
  return {
success: false,
error: 'missing_state',
message: 'No state in callback',
  };
}

const storedState = this.storage.getState();
if (!storedState || !validateStateToken(storedState, state)) {
  return {
success: false,
error: 'invalid_state',
message: 'Invalid state token',
  };
}

return await this.resolveToken(token);
  }

  async resolveToken(token: string): Promise<ApiResponse<OIDCClaims>> {
const result = await resolveOIDCClaims(this.config.apiBaseUrl, token);
if (result.success && result.data) {
  this.storage.storeToken(token);
  this.storage.storeUserData(result.data);
}
return result;
  }

  async refreshUserData(): Promise<ApiResponse<OIDCClaims>> {
const token = this.storage.getToken();
if (!token) {
  return { success: false, error: 'no_token', message: 'No stored token' };
}

const result = await resolveOIDCClaims(this.config.apiBaseUrl, token);
if (result.success && result.data) {
  this.storage.storeUserData(result.data);
}
return result;
  }

  isAuthenticated(): boolean {
return isAuthenticated(this.storage);
  }

  getAuthState(): AuthState {
return getAuthState(this.storage);
  }

  logout(): void {
this.storage.clearAll();
this.clientInfoCache = null;
  }
}
