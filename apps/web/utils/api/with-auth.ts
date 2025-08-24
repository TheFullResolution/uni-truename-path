// TrueNamePath: Higher-Order Function for API Route Authentication
// Higher-order function that wraps API route handlers with standardized authentication
// Date: August 12, 2025
// Academic project infrastructure for consistent API patterns

import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/generated/database';
import { type AuthenticatedUser, createClientWithToken } from '../auth/server';
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
 * Extended to support OAuth Bearer token authentication
 */
export interface AuthenticatedContext {
  user: AuthenticatedUser | null;
  requestId: string;
  timestamp: string;
  isAuthenticated: boolean;
  supabase: SupabaseClient<Database>;
  // OAuth-specific fields
  isOAuth: boolean;
  oauthSession?: {
id: string;
appId: string;
sessionId: string;
appName: string;
  };
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
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Higher-order function that wraps API route handlers with standardized authentication
 *
 * MIDDLEWARE-FIRST AUTHENTICATION SYSTEM:
 * This HOF now reads authentication status from middleware headers instead of
 * performing duplicate authentication calls. The middleware handles authentication
 * verification and passes the results via secure headers.
 *
 * Features:
 * - Reads authentication from middleware headers (single source of truth)
 * - Consistent authentication patterns across all API routes
 * - Standardized JSend response format
 * - Request ID generation and logging
 * - Support for both required and optional authentication modes
 * - Comprehensive error handling with proper HTTP status codes
 * - TypeScript-first design with proper type inference
 * - Performance improvement through eliminated duplicate auth calls
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

// Minimal logging for academic demonstration

try {
  // 1. Read core authentication status from middleware headers
  const authVerified =
request.headers.get('x-authentication-verified') === 'true';
  const userId = request.headers.get('x-authenticated-user-id') || '';

  // 1.1. Read OAuth-specific headers from middleware
  const isOAuthAuth =
request.headers.get('x-oauth-authenticated') === 'true';
  const oauthSessionId = request.headers.get('x-oauth-session-id') || '';
  const oauthAppId = request.headers.get('x-oauth-app-id') || '';

  // 1.2. Read personal data headers (only available for internal routes)
  const userEmail = request.headers.get('x-authenticated-user-email') || '';
  const userProfileHeader = request.headers.get(
'x-authenticated-user-profile',
  );

  let user: AuthenticatedUser | null = null;
  let oauthSession = undefined;

  // 2. Build authentication context based on available headers
  if (authVerified && userId) {
if (isOAuthAuth && oauthSessionId && oauthAppId) {
  // OAuth authentication: Handle both minimal and full contexts
  let appName = oauthAppId; // Default fallback

  if (userEmail) {
// Internal OAuth route: Full context with profile data from headers
user = buildInternalAuthContext(
  userId,
  userEmail,
  userProfileHeader,
);
// Extract app name from profile header if available
if (
  user?.profile &&
  typeof user.profile === 'object' &&
  'app_name' in user.profile
) {
  appName =
(user.profile as { app_name?: string }).app_name || oauthAppId;
}
  } else {
// External OAuth route: Minimal context from database
const oauthContext = await buildOAuthAuthContext(
  userId,
  oauthSessionId,
  oauthAppId,
);
user = oauthContext.user;
appName = oauthContext.appName;
  }

  oauthSession = {
id: oauthSessionId,
appId: oauthAppId,
sessionId: oauthSessionId,
appName,
  };
} else if (userEmail) {
  // Regular internal route: Build full context with profile data
  user = buildInternalAuthContext(userId, userEmail, userProfileHeader);
} else {
  // Fallback: Basic user context with minimal data
  user = {
id: userId,
email: '', // No email available for minimal routes
profile: undefined,
  };
}
  }

  // 2. Handle authentication based on mode
  if (options.authMode === 'required') {
if (!authVerified || !user) {
  const errorResponse = createErrorResponse(
'AUTHENTICATION_REQUIRED',
'Authentication required',
requestId,
undefined,
timestamp,
  );

  // Allow custom error handler to override default behavior
  const finalError = options.onAuthError
? options.onAuthError(
{
  code: 'AUTHENTICATION_REQUIRED',
  message: 'Authentication required',
},
requestId,
  )
: errorResponse;

  // Log authentication failure for debugging
  console.error(
`Authentication failed [${requestId}]: ${finalError.error.code}`,
  );

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
  // For compatibility, still check for header-based auth as fallback
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.replace('Bearer ', '') : undefined;

  // Create authenticated client (uses token if available, otherwise cookies)
  const authenticatedClient = await createClientWithToken(token);

  const context: AuthenticatedContext = {
user,
requestId,
timestamp,
isAuthenticated: authVerified && !!user,
supabase: authenticatedClient,
// OAuth context fields
isOAuth: isOAuthAuth,
oauthSession,
  };

  // 4. Call the wrapped handler
  const result = await handler(request, context);

  // Handler executed successfully

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
  console.error(
`API Error [${requestId}]:`,
error instanceof Error ? error.message : 'Unknown error',
  );

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
 *
 * MIDDLEWARE-FIRST: Now reads authentication from middleware headers
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
 *
 * MIDDLEWARE-FIRST: Now reads authentication from middleware headers
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

/**
 * Shared handler for unsupported HTTP methods
 * Eliminates boilerplate code in API routes by providing a single function
 * for all method not allowed responses
 */
export function handle_method_not_allowed(allowed_methods: string[]): Response {
  const request_id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const error_response = createErrorResponse(
'METHOD_NOT_ALLOWED',
`Method not allowed. Use ${allowed_methods.join(' or ')} for this endpoint.`,
request_id,
{ allowed_methods },
timestamp,
  );

  return new Response(JSON.stringify(error_response), {
status: 405,
headers: {
  'Allow': allowed_methods.join(', '),
  'Content-Type': 'application/json',
  'X-Request-ID': request_id,
},
  });
}

/**
 * Validate UUID format - extracted to eliminate duplicated validation logic
 * across API routes
 */
export function validate_uuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
id,
  );
}

/**
 * Build OAuth-specific authentication context with minimal data exposure
 * Fetches only essential OAuth session and app data from database
 */
async function buildOAuthAuthContext(
  userId: string,
  sessionId: string,
  appId: string,
): Promise<{ user: AuthenticatedUser; appName: string }> {
  try {
// Create server client for database access
const supabase = await import('../supabase/server').then((m) =>
  m.createClient(),
);

// Fetch minimal OAuth session data
const { data: sessionData } = await supabase
  .from('oauth_sessions')
  .select(
`
id,
oauth_applications!inner(
  id,
  app_name,
  display_name
)
  `,
  )
  .eq('id', sessionId)
  .eq('profile_id', userId)
  .single();

const user: AuthenticatedUser = {
  id: userId,
  email: '', // No email exposure for OAuth context
  profile: undefined, // No profile data for OAuth-only routes
};

const appName = sessionData?.oauth_applications?.display_name || appId;

return { user, appName };
  } catch (error) {
// Fallback to minimal context on error
console.warn('Failed to build OAuth context:', error);
return {
  user: {
id: userId,
email: '',
profile: undefined,
  },
  appName: appId,
};
  }
}

/**
 * Build internal route authentication context with full profile data
 * Uses headers provided by middleware for performance optimization
 */
function buildInternalAuthContext(
  userId: string,
  userEmail: string,
  profileHeader: string | null,
): AuthenticatedUser {
  let profile = undefined;
  if (profileHeader) {
try {
  profile = JSON.parse(profileHeader);
} catch (error) {
  console.warn(
'Failed to parse user profile from middleware header:',
error,
  );
}
  }

  return {
id: userId,
email: userEmail,
profile,
  };
}
