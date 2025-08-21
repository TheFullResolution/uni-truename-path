// TrueNamePath: Shared API Authentication Helpers
// Common authentication and user validation patterns
// Date: August 20, 2025
// Academic project shared utilities for API routes

import { createErrorResponse, type AuthenticatedContext } from './with-auth';
import { ErrorCodes } from './types';

/**
 * Validates that a user exists and has a profile
 * Common pattern used across multiple API routes
 */
export function validate_authenticated_user(
  user: AuthenticatedContext['user'],
  request_id: string,
  timestamp: string,
):
  | { error: ReturnType<typeof createErrorResponse> }
  | { authenticated_user_id: string; profile_id: string } {
  if (!user) {
return {
  error: createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
request_id,
{},
timestamp,
  ),
};
  }

  if (!user.profile?.id) {
return {
  error: createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User profile not found',
request_id,
undefined,
timestamp,
  ),
};
  }

  return {
authenticated_user_id: user.id,
profile_id: user.profile.id,
  };
}

/**
 * Validates that a user exists (without profile requirement)
 * Used for routes that only need basic authentication
 */
export function validate_user_authentication(
  user: AuthenticatedContext['user'],
  request_id: string,
  timestamp: string,
) {
  if (!user) {
return {
  error: createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
request_id,
{},
timestamp,
  ),
};
  }

  return {
authenticated_user_id: user.id,
  };
}

/**
 * Validates that user has access to their profile data
 * Includes member since calculation
 */
export function get_user_profile_data(
  user: AuthenticatedContext['user'],
  request_id: string,
  timestamp: string,
):
  | { error: ReturnType<typeof createErrorResponse> }
  | {
  authenticated_user_id: string;
  profile_id: string;
  user_profile: {
email: string;
profile_id: string;
member_since: string;
  };
} {
  const validation_result = validate_authenticated_user(
user,
request_id,
timestamp,
  );

  if ('error' in validation_result) {
return validation_result;
  }

  // Calculate member since date (use user creation or profile creation)
  const member_since = user?.created_at || new Date().toISOString();

  return {
...validation_result,
user_profile: {
  email: user?.email || '',
  profile_id: validation_result.profile_id,
  member_since,
},
  };
}
