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
  handle_method_not_allowed,
  validate_uuid,
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

/**
 * Shared authentication and validation helpers
 */
export {
  validate_authenticated_user,
  validate_user_authentication,
  get_user_profile_data,
} from './auth-helpers';

export {
  validate_context_ownership,
  validate_name_ownership,
  validate_assignment_ownership,
  handle_database_error,
  check_assignment_exists,
} from './resource-validators';
