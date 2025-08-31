// TrueNamePath: Shared API Resource Validation Helpers
// Common ownership and resource access validation patterns
// Date: August 20, 2025
// Academic project shared utilities for API routes

import { Database } from '@/generated/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createErrorResponse } from './with-auth';
import { ErrorCodes } from './types';

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Validates user owns a specific context
 * Common pattern for context-related operations
 */
export async function validate_context_ownership(
  supabase: SupabaseClientType,
  context_id: string,
  authenticated_user_id: string,
  request_id: string,
  timestamp: string,
) {
  const { data: context_check, error: context_error } = await supabase
.from('user_contexts')
.select('id, context_name')
.eq('id', context_id)
.eq('user_id', authenticated_user_id)
.single();

  if (context_error) {
console.error(
  `Context ownership check failed [${request_id}]:`,
  context_error,
);
return {
  error: createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to verify context ownership',
request_id,
{ error: context_error.message },
timestamp,
  ),
};
  }

  if (!context_check) {
return {
  error: createErrorResponse(
ErrorCodes.FORBIDDEN,
'Context not found or access denied',
request_id,
{},
timestamp,
  ),
};
  }

  return {
context_data: context_check,
  };
}

/**
 * Validates user owns a specific name
 * Common pattern for name-related operations
 */
export async function validate_name_ownership(
  supabase: SupabaseClientType,
  name_id: string,
  authenticated_user_id: string,
  request_id: string,
  timestamp: string,
) {
  const { data: name_check, error: name_error } = await supabase
.from('names')
.select('id, name_text, oidc_property_type')
.eq('id', name_id)
.eq('user_id', authenticated_user_id)
.single();

  if (name_error) {
console.error(`Name ownership check failed [${request_id}]:`, name_error);
return {
  error: createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to verify name ownership',
request_id,
{ error: name_error.message },
timestamp,
  ),
};
  }

  if (!name_check) {
return {
  error: createErrorResponse(
ErrorCodes.FORBIDDEN,
'Name not found or access denied',
request_id,
{},
timestamp,
  ),
};
  }

  return {
name_data: name_check,
  };
}

/**
 * Handles database operation errors with consistent error response
 * Common pattern for database error handling
 */
export function handle_database_error(
  error: { message: string; code?: string; details?: string; hint?: string },
  operation_name: string,
  request_id: string,
  timestamp: string,
  development_message?: string,
) {
  console.error(`${operation_name} failed [${request_id}]:`, {
error: error.message,
code: error.code,
details: error.details,
hint: error.hint,
  });

  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
`Database operation failed: ${operation_name}`,
request_id,
process.env.NODE_ENV === 'development'
  ? development_message || error.message
  : `Unable to complete ${operation_name.toLowerCase()}`,
timestamp,
  );
}
