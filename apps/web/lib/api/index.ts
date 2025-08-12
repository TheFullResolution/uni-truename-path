// TrueNamePath: API Infrastructure Barrel Exports
// Centralized exports for consistent API patterns and response handling
// Date: August 12, 2025

/**
 * Higher-order function exports for authentication
 */
export {
  withAuth,
  withRequiredAuth,
  withOptionalAuth,
  createSuccessResponse,
  createErrorResponse,
} from './with-auth';

export type {
  AuthMode,
  AuthenticatedContext,
  AuthenticatedHandler,
  WithAuthOptions,
} from './with-auth';

/**
 * Standardized response type exports
 */
export {
  ErrorCodes,
  StatusCodeMap,
  getStatusCode,
  isSuccessResponse,
  isErrorResponse,
} from './types';

export type {
  ApiResponses,
} from './types';

export type {
  StandardSuccessResponse,
  StandardErrorResponse,
  StandardResponse,
  ErrorCode,
  ValidationErrorDetail,
  ValidationErrorDetails,
  PaginationMeta,
  PaginatedResponse,
  ListQueryParams,
  ExtractSuccessData,
} from './types';