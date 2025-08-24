// TrueNamePath: Standardized API Response Types
// Comprehensive type definitions for consistent API responses across all endpoints
// Date: August 12, 2025
// Academic project infrastructure implementing JSend specification

/**
 * JSend Specification Implementation for TrueNamePath API
 *
 * Based on the JSend specification: https://github.com/omniti-labs/jsend
 * All API responses follow this consistent format for academic-quality code
 * and maintainable API design patterns.
 */

/**
 * Base response interface with common metadata
 */
export interface BaseResponse {
  /**
   * Unique identifier for the request, useful for debugging and logging
   * Format: req_${timestamp}_${randomString}
   */
  requestId: string;

  /**
   * ISO 8601 timestamp when the response was generated
   */
  timestamp: string;
}

/**
 * Standardized success response following JSend specification
 * Used when an API call is successful and returns data
 *
 * @template T - Type of the data being returned
 */
export interface StandardSuccessResponse<T = unknown> extends BaseResponse {
  /**
   * Always true for successful responses
   */
  success: true;

  /**
   * The data payload returned by the API
   */
  data: T;
}

/**
 * Standardized error response following JSend specification
 * Used when an API call fails due to client or server errors
 */
export interface StandardErrorResponse extends BaseResponse {
  /**
   * Always false for error responses
   */
  success: false;

  /**
   * Error information with structured details
   */
  error: {
/**
 * Machine-readable error code for programmatic handling
 * Should be consistent across the API for the same error types
 */
code: string;

/**
 * Human-readable error message for debugging and user feedback
 */
message: string;

/**
 * Optional additional details about the error
 * May include validation errors, stack traces (in development), etc.
 */
details?: unknown;

/**
 * Request ID for correlation with logs
 */
requestId: string;

/**
 * Timestamp when the error occurred
 */
timestamp: string;
  };
}

/**
 * Union type for all possible API responses
 * This ensures type safety when handling API responses
 *
 * @template T - Type of the success data payload
 */
export type StandardResponse<T = unknown> =
  | StandardSuccessResponse<T>
  | StandardErrorResponse;

/**
 * Comprehensive error codes used throughout the TrueNamePath API
 * These provide a standardized vocabulary for error handling
 */
export const ErrorCodes = {
  // Authentication & Authorization Errors (400-403 range)
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  TOKEN_VERIFICATION_FAILED: 'TOKEN_VERIFICATION_FAILED',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  FORBIDDEN: 'FORBIDDEN',

  // Request Validation Errors (400 range)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_FORMAT: 'INVALID_FIELD_FORMAT',
  INVALID_UUID: 'INVALID_UUID',

  // Resource Errors (404 range)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  CONTEXT_NOT_FOUND: 'CONTEXT_NOT_FOUND',
  NAME_NOT_FOUND: 'NAME_NOT_FOUND',
  CONSENT_NOT_FOUND: 'CONSENT_NOT_FOUND',

  // HTTP Method Errors (405 range)
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',

  // Business Logic Errors (409 range)
  CONFLICT: 'CONFLICT',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  DUPLICATE_NAME: 'DUPLICATE_NAME',
  DUPLICATE_CONTEXT: 'DUPLICATE_CONTEXT',
  CONSENT_ALREADY_EXISTS: 'CONSENT_ALREADY_EXISTS',

  // Server & Infrastructure Errors (500 range)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // TrueNamePath-specific Business Logic Errors
  NAME_RESOLUTION_FAILED: 'NAME_RESOLUTION_FAILED',
  CONSENT_REQUEST_FAILED: 'CONSENT_REQUEST_FAILED',
  CONSENT_GRANT_FAILED: 'CONSENT_GRANT_FAILED',
  CONSENT_REVOKE_FAILED: 'CONSENT_REVOKE_FAILED',
  CONTEXT_CREATION_FAILED: 'CONTEXT_CREATION_FAILED',
  NAME_ASSIGNMENT_FAILED: 'NAME_ASSIGNMENT_FAILED',
  AUDIT_LOG_FAILED: 'AUDIT_LOG_FAILED',

  // Signup-specific Errors
  SIGNUP_ALREADY_COMPLETED: 'SIGNUP_ALREADY_COMPLETED',
  SIGNUP_TRANSACTION_FAILED: 'SIGNUP_TRANSACTION_FAILED',
  SIGNUP_NAME_CREATION_FAILED: 'SIGNUP_NAME_CREATION_FAILED',
  SIGNUP_CONTEXT_CREATION_FAILED: 'SIGNUP_CONTEXT_CREATION_FAILED',
  SIGNUP_OIDC_ASSIGNMENT_FAILED: 'SIGNUP_OIDC_ASSIGNMENT_FAILED',
  SIGNUP_USER_ID_MISMATCH: 'SIGNUP_USER_ID_MISMATCH',
  SIGNUP_CONSTRAINT_VIOLATION: 'SIGNUP_CONSTRAINT_VIOLATION',
  SIGNUP_EMAIL_REQUIRED: 'SIGNUP_EMAIL_REQUIRED',
  SIGNUP_DATA_RETRIEVAL_FAILED: 'SIGNUP_DATA_RETRIEVAL_FAILED',

  // OAuth-specific Errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  APP_NOT_FOUND: 'APP_NOT_FOUND',
  APP_INACTIVE: 'APP_INACTIVE',
  CONTEXT_NOT_ASSIGNED: 'CONTEXT_NOT_ASSIGNED',
  INVALID_CALLBACK_URL: 'INVALID_CALLBACK_URL',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

/**
 * Type-safe error code union from the ErrorCodes constant
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * HTTP status code mappings for different error types
 * This ensures consistent HTTP status codes across the API
 */
export const StatusCodeMap: Record<ErrorCode, number> = {
  // Authentication & Authorization (401-403)
  [ErrorCodes.AUTHENTICATION_REQUIRED]: 401,
  [ErrorCodes.AUTHENTICATION_FAILED]: 401,
  [ErrorCodes.TOKEN_VERIFICATION_FAILED]: 401,
  [ErrorCodes.AUTHORIZATION_ERROR]: 403,
  [ErrorCodes.AUTHORIZATION_FAILED]: 403,
  [ErrorCodes.FORBIDDEN]: 403,

  // Bad Request (400)
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_JSON]: 400,
  [ErrorCodes.INVALID_REQUEST]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCodes.INVALID_FIELD_FORMAT]: 400,
  [ErrorCodes.INVALID_UUID]: 400,

  // Not Found (404)
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
  [ErrorCodes.USER_NOT_FOUND]: 404,
  [ErrorCodes.PROFILE_NOT_FOUND]: 404,
  [ErrorCodes.CONTEXT_NOT_FOUND]: 404,
  [ErrorCodes.NAME_NOT_FOUND]: 404,
  [ErrorCodes.CONSENT_NOT_FOUND]: 404,

  // Method Not Allowed (405)
  [ErrorCodes.METHOD_NOT_ALLOWED]: 405,

  // Conflict (409)
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.DUPLICATE_RESOURCE]: 409,
  [ErrorCodes.DUPLICATE_NAME]: 409,
  [ErrorCodes.DUPLICATE_CONTEXT]: 409,
  [ErrorCodes.CONSENT_ALREADY_EXISTS]: 409,

  // Signup-specific Errors (400-500 range based on context)
  [ErrorCodes.SIGNUP_ALREADY_COMPLETED]: 409,
  [ErrorCodes.SIGNUP_TRANSACTION_FAILED]: 500,
  [ErrorCodes.SIGNUP_NAME_CREATION_FAILED]: 500,
  [ErrorCodes.SIGNUP_CONTEXT_CREATION_FAILED]: 500,
  [ErrorCodes.SIGNUP_OIDC_ASSIGNMENT_FAILED]: 500,
  [ErrorCodes.SIGNUP_USER_ID_MISMATCH]: 400,
  [ErrorCodes.SIGNUP_CONSTRAINT_VIOLATION]: 400,
  [ErrorCodes.SIGNUP_EMAIL_REQUIRED]: 400,
  [ErrorCodes.SIGNUP_DATA_RETRIEVAL_FAILED]: 500,

  // Server Errors (500-504)
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.NETWORK_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  [ErrorCodes.TIMEOUT_ERROR]: 504,

  // Business Logic Errors (500 range - internal processing failures)
  [ErrorCodes.NAME_RESOLUTION_FAILED]: 500,
  [ErrorCodes.CONSENT_REQUEST_FAILED]: 500,
  [ErrorCodes.CONSENT_GRANT_FAILED]: 500,
  [ErrorCodes.CONSENT_REVOKE_FAILED]: 500,
  [ErrorCodes.CONTEXT_CREATION_FAILED]: 500,
  [ErrorCodes.NAME_ASSIGNMENT_FAILED]: 500,
  [ErrorCodes.AUDIT_LOG_FAILED]: 500,

  // OAuth Errors (400-429 range)
  [ErrorCodes.INVALID_TOKEN]: 401,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.APP_NOT_FOUND]: 404,
  [ErrorCodes.APP_INACTIVE]: 403,
  [ErrorCodes.CONTEXT_NOT_ASSIGNED]: 404,
  [ErrorCodes.INVALID_CALLBACK_URL]: 400,
  [ErrorCodes.RATE_LIMITED]: 429,
};

/**
 * Helper function to get appropriate HTTP status code for an error code
 */
export function getStatusCode(errorCode: ErrorCode): number {
  return StatusCodeMap[errorCode] || 500;
}

/**
 * Validation error detail interface for structured validation feedback
 */
export interface ValidationErrorDetail {
  /**
   * The field path that failed validation (e.g., "user.email", "contextName")
   */
  field: string;

  /**
   * Human-readable validation error message
   */
  message: string;

  /**
   * Machine-readable validation error code
   */
  code: string;

  /**
   * The value that failed validation (optional, for debugging)
   */
  value?: unknown;
}

/**
 * Validation error details array type
 */
export type ValidationErrorDetails = ValidationErrorDetail[];

/**
 * Pagination metadata interface for list endpoints
 */
export interface PaginationMeta {
  /**
   * Current page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of items available
   */
  total: number;

  /**
   * Total number of pages available
   */
  totalPages: number;

  /**
   * Whether there are more items after the current page
   */
  hasNext: boolean;

  /**
   * Whether there are items before the current page
   */
  hasPrevious: boolean;
}

/**
 * Paginated response wrapper for list endpoints
 */
export interface PaginatedResponse<T> {
  /**
   * Array of items in the current page
   */
  items: T[];

  /**
   * Pagination metadata
   */
  pagination: PaginationMeta;
}

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams {
  /**
   * Page number (1-based, default: 1)
   */
  page?: number;

  /**
   * Number of items per page (default: 10, max: 100)
   */
  limit?: number;

  /**
   * Sort field (implementation-specific)
   */
  sort?: string;

  /**
   * Sort order (asc or desc, default: desc)
   */
  order?: 'asc' | 'desc';

  /**
   * Search query string (optional)
   */
  search?: string;
}

/**
 * Type guard to check if a response is successful
 */
export function isSuccessResponse<T>(
  response: StandardResponse<T>,
): response is StandardSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(
  response: StandardResponse<unknown>,
): response is StandardErrorResponse {
  return response.success === false;
}

/**
 * Utility type for extracting data type from a success response
 */
export type ExtractSuccessData<T> =
  T extends StandardSuccessResponse<infer U> ? U : never;
