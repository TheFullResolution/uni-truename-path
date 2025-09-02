// API Response Types

import { OAuthErrorCodes } from '@/app/api/oauth/types';

/**
 * Base response interface with common metadata
 */
export interface BaseResponse {
  requestId: string;
  timestamp: string;
}

/**
 * Standardized success response
 */
export interface StandardSuccessResponse<T = unknown> extends BaseResponse {
  success: true;
  data: T;
}

/**
 * Standardized error response
 */
export interface StandardErrorResponse extends BaseResponse {
  success: false;
  error: {
code: string;
message: string;
details?: unknown;
requestId: string;
timestamp: string;
  };
}

export type StandardResponse<T = unknown> =
  | StandardSuccessResponse<T>
  | StandardErrorResponse;
export const ErrorCodes = {
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  TOKEN_VERIFICATION_FAILED: 'TOKEN_VERIFICATION_FAILED',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  FORBIDDEN: 'FORBIDDEN',

  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_FORMAT: 'INVALID_FIELD_FORMAT',
  INVALID_UUID: 'INVALID_UUID',

  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  CONTEXT_NOT_FOUND: 'CONTEXT_NOT_FOUND',
  NAME_NOT_FOUND: 'NAME_NOT_FOUND',
  CONSENT_NOT_FOUND: 'CONSENT_NOT_FOUND',

  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',

  CONFLICT: 'CONFLICT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  DUPLICATE_NAME: 'DUPLICATE_NAME',
  DUPLICATE_CONTEXT: 'DUPLICATE_CONTEXT',
  CONSENT_ALREADY_EXISTS: 'CONSENT_ALREADY_EXISTS',

  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  NAME_RESOLUTION_FAILED: 'NAME_RESOLUTION_FAILED',
  CONSENT_REQUEST_FAILED: 'CONSENT_REQUEST_FAILED',
  CONSENT_GRANT_FAILED: 'CONSENT_GRANT_FAILED',
  CONSENT_REVOKE_FAILED: 'CONSENT_REVOKE_FAILED',
  CONTEXT_CREATION_FAILED: 'CONTEXT_CREATION_FAILED',
  NAME_ASSIGNMENT_FAILED: 'NAME_ASSIGNMENT_FAILED',
  AUDIT_LOG_FAILED: 'AUDIT_LOG_FAILED',

  SIGNUP_ALREADY_COMPLETED: 'SIGNUP_ALREADY_COMPLETED',
  SIGNUP_TRANSACTION_FAILED: 'SIGNUP_TRANSACTION_FAILED',
  SIGNUP_NAME_CREATION_FAILED: 'SIGNUP_NAME_CREATION_FAILED',
  SIGNUP_CONTEXT_CREATION_FAILED: 'SIGNUP_CONTEXT_CREATION_FAILED',
  SIGNUP_OIDC_ASSIGNMENT_FAILED: 'SIGNUP_OIDC_ASSIGNMENT_FAILED',
  SIGNUP_USER_ID_MISMATCH: 'SIGNUP_USER_ID_MISMATCH',
  SIGNUP_CONSTRAINT_VIOLATION: 'SIGNUP_CONSTRAINT_VIOLATION',
  SIGNUP_EMAIL_REQUIRED: 'SIGNUP_EMAIL_REQUIRED',
  SIGNUP_DATA_RETRIEVAL_FAILED: 'SIGNUP_DATA_RETRIEVAL_FAILED',

  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  APP_INACTIVE: 'APP_INACTIVE',
  CONTEXT_NOT_ASSIGNED: 'CONTEXT_NOT_ASSIGNED',
  INVALID_CALLBACK_URL: 'INVALID_CALLBACK_URL',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export type AllErrorCodes =
  | ErrorCode
  | import('@/app/api/oauth/types').OAuthErrorCode;
export const StatusCodeMap: Record<ErrorCode, number> &
  Record<import('@/app/api/oauth/types').OAuthErrorCode, number> = {
  [ErrorCodes.AUTHENTICATION_REQUIRED]: 401,
  [ErrorCodes.AUTHENTICATION_FAILED]: 401,
  [ErrorCodes.TOKEN_VERIFICATION_FAILED]: 401,
  [ErrorCodes.AUTHORIZATION_ERROR]: 403,
  [ErrorCodes.AUTHORIZATION_FAILED]: 403,
  [ErrorCodes.FORBIDDEN]: 403,

  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_JSON]: 400,
  [ErrorCodes.INVALID_REQUEST]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCodes.INVALID_FIELD_FORMAT]: 400,
  [ErrorCodes.INVALID_UUID]: 400,

  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
  [ErrorCodes.USER_NOT_FOUND]: 404,
  [ErrorCodes.PROFILE_NOT_FOUND]: 404,
  [ErrorCodes.CONTEXT_NOT_FOUND]: 404,
  [ErrorCodes.NAME_NOT_FOUND]: 404,
  [ErrorCodes.CONSENT_NOT_FOUND]: 404,

  [ErrorCodes.METHOD_NOT_ALLOWED]: 405,

  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.DUPLICATE_RESOURCE]: 409,
  [ErrorCodes.DUPLICATE_NAME]: 409,
  [ErrorCodes.DUPLICATE_CONTEXT]: 409,
  [ErrorCodes.CONSENT_ALREADY_EXISTS]: 409,

  [ErrorCodes.SIGNUP_ALREADY_COMPLETED]: 409,
  [ErrorCodes.SIGNUP_TRANSACTION_FAILED]: 500,
  [ErrorCodes.SIGNUP_NAME_CREATION_FAILED]: 500,
  [ErrorCodes.SIGNUP_CONTEXT_CREATION_FAILED]: 500,
  [ErrorCodes.SIGNUP_OIDC_ASSIGNMENT_FAILED]: 500,
  [ErrorCodes.SIGNUP_USER_ID_MISMATCH]: 400,
  [ErrorCodes.SIGNUP_CONSTRAINT_VIOLATION]: 400,
  [ErrorCodes.SIGNUP_EMAIL_REQUIRED]: 400,
  [ErrorCodes.SIGNUP_DATA_RETRIEVAL_FAILED]: 500,

  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.NETWORK_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.TIMEOUT_ERROR]: 504,

  [ErrorCodes.NAME_RESOLUTION_FAILED]: 500,
  [ErrorCodes.CONSENT_REQUEST_FAILED]: 500,
  [ErrorCodes.CONSENT_GRANT_FAILED]: 500,
  [ErrorCodes.CONSENT_REVOKE_FAILED]: 500,
  [ErrorCodes.CONTEXT_CREATION_FAILED]: 500,
  [ErrorCodes.NAME_ASSIGNMENT_FAILED]: 500,
  [ErrorCodes.AUDIT_LOG_FAILED]: 500,

  [ErrorCodes.INVALID_TOKEN]: 401,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.APP_NOT_FOUND]: 404,
  [ErrorCodes.APP_INACTIVE]: 403,
  [ErrorCodes.CONTEXT_NOT_ASSIGNED]: 404,
  [ErrorCodes.INVALID_CALLBACK_URL]: 400,
  [ErrorCodes.RATE_LIMITED]: 429,
  [OAuthErrorCodes.MISSING_ORIGIN_HEADER]: 400,
  [OAuthErrorCodes.INVALID_DOMAIN_FORMAT]: 400,
  [OAuthErrorCodes.APP_NAME_TAKEN]: 409,
  [OAuthErrorCodes.APP_NOT_FOUND]: 404,
  [OAuthErrorCodes.INVALID_REDIRECT_URI]: 400,
  [OAuthErrorCodes.APP_INACTIVE]: 403,
  [OAuthErrorCodes.REGISTRATION_FAILED]: 500,
  [OAuthErrorCodes.UPDATE_FAILED]: 500,
  [OAuthErrorCodes.DELETION_FAILED]: 500,
  [OAuthErrorCodes.CLIENT_ID_GENERATION_FAILED]: 500,
  [OAuthErrorCodes.INVALID_TOKEN]: 401,
  [OAuthErrorCodes.TOKEN_EXPIRED]: 401,
  [OAuthErrorCodes.NO_CONTEXT_ASSIGNED]: 404,
  [OAuthErrorCodes.RESOLUTION_FAILED]: 500,
  [OAuthErrorCodes.TOKEN_REVOKED]: 410,
  [OAuthErrorCodes.REVOCATION_FAILED]: 500,
};

export function getStatusCode(errorCode: ErrorCode): number {
  return StatusCodeMap[errorCode] || 500;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export type ValidationErrorDetails = ValidationErrorDetail[];

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export function isSuccessResponse<T>(
  response: StandardResponse<T>,
): response is StandardSuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(
  response: StandardResponse<unknown>,
): response is StandardErrorResponse {
  return response.success === false;
}

export type ExtractSuccessData<T> =
  T extends StandardSuccessResponse<infer U> ? U : never;
