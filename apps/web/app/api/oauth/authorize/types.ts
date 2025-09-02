// OAuth Authorization types
export interface OAuthAuthorizeResponseData {
  session_token: string;
  expires_at: string;
  redirect_url: string;
  client: {
client_id: string;
display_name: string;
publisher_domain: string;
  };
  context: {
id: string;
context_name: string;
  };
}

export interface OAuthSessionCreationData {
  user_id: string;
  app_id: string;
  context_id: string;
  session_token: string;
  expires_at: string;
  return_url: string;
  status: 'active';
  created_at: string;
}

export interface AuthorizeClientInfo {
  client_id: string;
  display_name: string;
  publisher_domain: string;
  app_name: string;
}

export interface AuthorizeContextInfo {
  id: string;
  context_name: string;
  user_id: string;
}

export interface AuthorizationParams {
  user_id: string;
  app_id: string;
  context_id: string;
  return_url: string;
  timestamp: string;
}

export interface AuthorizationResult {
  session: OAuthSessionCreationData;
  client: AuthorizeClientInfo;
  context: AuthorizeContextInfo;
  redirect_url: string;
}

export const AuthorizeErrorCodes = {
  APP_NOT_FOUND: 'OAUTH_APP_NOT_FOUND',
  APP_INACTIVE: 'OAUTH_APP_INACTIVE',
  CLIENT_NOT_FOUND: 'OAUTH_CLIENT_NOT_FOUND',
  CONTEXT_NOT_FOUND: 'CONTEXT_NOT_FOUND',
  CONTEXT_ACCESS_DENIED: 'CONTEXT_ACCESS_DENIED',
  TOKEN_GENERATION_FAILED: 'TOKEN_GENERATION_FAILED',
  SESSION_CREATION_FAILED: 'SESSION_CREATION_FAILED',
  INVALID_RETURN_URL: 'INVALID_RETURN_URL',
  RETURN_URL_NOT_ALLOWED: 'RETURN_URL_NOT_ALLOWED',
} as const;

export type AuthorizeErrorCode =
  (typeof AuthorizeErrorCodes)[keyof typeof AuthorizeErrorCodes];

export interface AuthorizationValidation {
  app_valid: boolean;
  context_valid: boolean;
  return_url_valid: boolean;
  errors: Array<{
field: string;
code: AuthorizeErrorCode;
message: string;
  }>;
}

export interface AuthorizeResponseConfig {
  request_id: string;
  timestamp: string;
  user_id: string;
  response_builders: {
success: (data: OAuthAuthorizeResponseData) => unknown;
error: (code: string, message: string, data?: unknown) => unknown;
  };
}

export interface TokenValidation {
  format_valid: boolean;
  uniqueness_verified: boolean;
  generated_at: string;
}
