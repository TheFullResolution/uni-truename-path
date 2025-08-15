// TrueNamePath: Higher-Order Function for API Route Authentication
// Higher-order function that wraps API route handlers with standardized authentication
// Date: August 12, 2025
// Academic project infrastructure for consistent API patterns

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '../../types/generated';
import {
  apiAuth,
  type AuthenticatedUser,
  createClientWithToken,
} from '../auth/server';
import {
  type StandardSuccessResponse,
  type StandardErrorResponse,
  type StandardResponse,
  type ErrorCode,
  getStatusCode,
} from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Authentication modes for API routes
 */
export type AuthMode = 'required' | 'optional';

/**
 * Context object passed to authenticated API route handlers
 */
export interface AuthenticatedContext {
  user: AuthenticatedUser | null;
  requestId: string;
  timestamp: string;
  isAuthenticated: boolean;
  supabase: SupabaseClient<Database>;
}

/**
 * Type for API route handlers that receive authentication context
 */
export type AuthenticatedHandler<T = unknown> = (
  request: NextRequest,
  context: AuthenticatedContext,
) => Promise<StandardResponse<T>>;

/**
 * Configuration options for the withAuth higher-order function
 */
export interface WithAuthOptions {
  /**
   * Authentication mode
   * - 'required': Route requires authentication, returns 401 if not authenticated
   * - 'optional': Route allows both authenticated and unauthenticated requests
   */
  authMode: AuthMode;

  /**
   * Optional custom error handler for authentication failures
   */
  onAuthError?: (
error: { code: string; message: string },
requestId: string,
  ) => StandardErrorResponse;

  /**
   * Enable request logging for debugging and monitoring
   */
  enableLogging?: boolean;
}

/**
 * Generate unique request ID for tracking and debugging
 * Uses timestamp and random string for uniqueness
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Higher-order function that wraps API route handlers with standardized authentication
 *
 * Features:
 * - Consistent authentication patterns across all API routes
 * - Standardized JSend response format
 * - Request ID generation and logging
 * - Support for both required and optional authentication modes
 * - Comprehensive error handling with proper HTTP status codes
 * - TypeScript-first design with proper type inference
 * - Integration with existing Supabase-based authentication system
 *
 * @param handler - The API route handler to wrap with authentication
 * @param options - Configuration options for authentication behavior
 * @returns Wrapped handler that returns standardized responses
 *
 * @example
 * ```typescript
 * // Required authentication
 * export const POST = withAuth(
 *   async (request, context) => {
 * // context.user is guaranteed to be non-null
 * return {
 *   success: true,
 *   data: { message: `Hello ${context.user.email}` },
 *   requestId: context.requestId,
 *   timestamp: context.timestamp,
 * };
 *   },
 *   { authMode: 'required' }
 * );
 *
 * // Optional authentication
 * export const GET = withAuth(
 *   async (request, context) => {
 * const message = context.isAuthenticated
 *   ? `Hello ${context.user?.email}`
 *   : 'Hello anonymous user';
 *
 * return {
 *   success: true,
 *   data: { message },
 *   requestId: context.requestId,
 *   timestamp: context.timestamp,
 * };
 *   },
 *   { authMode: 'optional' }
 * );
 * ```
 */
export function withAuth<T = unknown>(
  handler: AuthenticatedHandler<T>,
  options: WithAuthOptions,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
const requestId = generateRequestId();
const timestamp = new Date().toISOString();

// Enable logging if configured
const shouldLog =
  options.enableLogging ?? process.env.NODE_ENV === 'development';

try {
  if (shouldLog) {
console.log(`API Request [${requestId}]:`, {
  method: request.method,
  url: request.url,
  authMode: options.authMode,
  userAgent:
request.headers.get('user-agent')?.substring(0, 50) + '...',
});
  }

  // 1. Perform authentication check
  const authResult = await apiAuth.authenticateRequest(request);

  // 2. Handle authentication based on mode
  if (options.authMode === 'required') {
if (authResult.error || !authResult.user) {
  const errorResponse = createErrorResponse(
authResult.error?.code || 'AUTHENTICATION_REQUIRED',
authResult.error?.message || 'Authentication required',
requestId,
undefined,
timestamp,
  );

  // Allow custom error handler to override default behavior
  const finalError = options.onAuthError
? options.onAuthError(
{
  code: authResult.error?.code || 'AUTHENTICATION_REQUIRED',
  message:
authResult.error?.message || 'Authentication required',
},
requestId,
  )
: errorResponse;

  if (shouldLog) {
console.warn(`API Auth Failure [${requestId}]:`, {
  code: finalError.error.code,
  message: finalError.error.message,
});
  }

  return NextResponse.json(finalError, {
status: 401,
headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
},
  });
}
  }

  // 3. Create authentication context with authenticated Supabase client
  // Extract token for client creation (if using header-based auth)
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : undefined;

  // Create authenticated client (uses token if available, otherwise cookies)
  const authenticatedClient = await createClientWithToken(token);

  const context: AuthenticatedContext = {
user: authResult.user,
requestId,
timestamp,
isAuthenticated: !authResult.error && !!authResult.user,
supabase: authenticatedClient,
  };

  // 4. Call the wrapped handler
  const result = await handler(request, context);

  // 5. Log successful requests
  if (shouldLog) {
console.log(`API Success [${requestId}]:`, {
  authenticated: context.isAuthenticated,
  userId: context.user?.id?.substring(0, 8) + '...' || 'anonymous',
  responseType: result.success ? 'success' : 'error',
});
  }

  // 6. Determine appropriate HTTP status code
  let statusCode = 200;
  if (!result.success) {
// Type assertion: result is StandardErrorResponse when success is false
const errorResult = result as StandardErrorResponse;
// Use centralized status code mapping
statusCode = getStatusCode(errorResult.error.code as ErrorCode);
  }

  // 7. Return standardized response
  return NextResponse.json(result, {
status: statusCode,
headers: {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'X-Request-ID': requestId,
},
  });
} catch (error) {
  // Handle unexpected errors in the authentication wrapper
  console.error(`API Wrapper Error [${requestId}]:`, {
error: error instanceof Error ? error.message : 'Unknown error',
stack: error instanceof Error ? error.stack : undefined,
url: request.url,
  });

  const errorResponse = createErrorResponse(
'INTERNAL_SERVER_ERROR',
'Internal server error occurred',
requestId,
process.env.NODE_ENV === 'development'
  ? {
  message: error instanceof Error ? error.message : 'Unknown error',
}
  : undefined,
timestamp,
  );

  return NextResponse.json(errorResponse, {
status: 500,
headers: {
  'Content-Type': 'application/json',
  'X-Request-ID': requestId,
},
  });
}
  };
}

/**
 * Convenience wrapper for required authentication
 * Equivalent to withAuth(handler, { authMode: 'required' })
 */
export function withRequiredAuth<T = unknown>(
  handler: AuthenticatedHandler<T>,
  options?: Omit<WithAuthOptions, 'authMode'>,
): (request: NextRequest) => Promise<NextResponse> {
  return withAuth(handler, { ...options, authMode: 'required' });
}

/**
 * Convenience wrapper for optional authentication
 * Equivalent to withAuth(handler, { authMode: 'optional' })
 */
export function withOptionalAuth<T = unknown>(
  handler: AuthenticatedHandler<T>,
  options?: Omit<WithAuthOptions, 'authMode'>,
): (request: NextRequest) => Promise<NextResponse> {
  return withAuth(handler, { ...options, authMode: 'optional' });
}

/**
 * Helper function to create success responses with consistent format
 */
export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  timestamp?: string,
): StandardSuccessResponse<T> {
  return {
success: true,
data,
requestId,
timestamp: timestamp || new Date().toISOString(),
  };
}

/**
 * Helper function to create error responses with consistent format
 */
export function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
  timestamp?: string,
): StandardErrorResponse {
  return {
success: false,
requestId,
timestamp: timestamp || new Date().toISOString(),
error: {
  code,
  message,
  details,
  requestId,
  timestamp: timestamp || new Date().toISOString(),
},
  };
}
