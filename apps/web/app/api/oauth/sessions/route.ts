// TrueNamePath: OAuth Sessions Endpoint
// GET /api/oauth/sessions - Retrieve OAuth sessions for authenticated users
// Date: August 23, 2025
// Academic project OAuth session management - supports E2E testing and session tracking

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  AuthenticatedContext,
} from '@/utils/api/with-auth';
import { ErrorCodes, StandardResponse } from '@/utils/api/types';

interface OAuthSession {
  id: string;
  profile_id: string;
  app_id: string;
  session_token: string;
  expires_at: string;
  return_url: string;
  created_at: string;
  updated_at: string | null;
  used_at: string | null;
}

/**
 * GET /api/oauth/sessions
 *
 * Authenticated endpoint to retrieve OAuth sessions for the current user.
 * Used for testing and session management.
 *
 * Returns:
 * - Array of user's OAuth sessions
 * - Only returns sessions for the authenticated user
 * - Includes active and expired sessions for testing
 */
async function handleSessionsList(
  request: NextRequest,
  { user, supabase, requestId, timestamp }: AuthenticatedContext,
): Promise<StandardResponse<OAuthSession[]>> {
  if (!user?.id) {
return createErrorResponse(
  ErrorCodes.AUTHENTICATION_REQUIRED,
  'User authentication required',
  requestId,
  undefined,
  timestamp,
);
  }

  try {
// Query OAuth sessions for the authenticated user
const { data: sessions, error } = await supabase
  .from('oauth_sessions')
  .select('*')
  .eq('profile_id', user.id)
  .order('created_at', { ascending: false }); // Most recent first

if (error) {
  console.error(`[${requestId}] Database error fetching sessions:`, error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve OAuth sessions',
requestId,
undefined,
timestamp,
  );
}

// Return empty array if no sessions found (not an error)
const userSessions = sessions || [];

console.log(
  `[${requestId}] Retrieved ${userSessions.length} OAuth sessions for user ${user.id}`,
);

return createSuccessResponse(userSessions, requestId, timestamp);
  } catch (error) {
console.error(`[${requestId}] OAuth sessions lookup error:`, error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to retrieve OAuth sessions',
  requestId,
  undefined,
  timestamp,
);
  }
}

/**
 * GET /api/oauth/sessions
 * Authenticated endpoint wrapped with withRequiredAuth
 */
export const GET = withRequiredAuth(handleSessionsList);
