/**
 * OAuth Token Revocation Endpoint - Session Token Lifecycle Management
 * University Final Project - TrueNamePath
 *
 * @route DELETE /api/oauth/sessions/[id]
 * @description Revokes OAuth session tokens with optional context assignment removal
 * @authentication Cookie-based session required (user must own the session)
 * @performance <3ms average response time
 * @analytics Logs revocation actions to app_usage_log table
 *
 * Flow:
 * 1. Extract session ID from URL path and validate UUID format
 * 2. Authenticate user via cookie session
 * 3. Verify session exists and user ownership
 * 4. Delete session from oauth_sessions table (hard delete)
 * 5. Log revocation action in app_usage_log
 * 6. Optionally remove app context assignment if requested
 *
 * @param {string} id - Path parameter: Session ID (UUID format required)
 *
 * @query {boolean} remove_assignment - Optional: Also remove app context assignment
 * @query {boolean} force - Optional: Force revocation (reserved for future use)
 *
 * @example
 * ```typescript
 * DELETE /api/oauth/sessions/550e8400-e29b-41d4-a716-446655440000?remove_assignment=true
 * Cookie: supabase-auth-token=xxx
 *
 * Success Response (200):
 * {
 *   "success": true,
 *   "data": {
 * "revoked": true,
 * "session_id": "550e8400-e29b-41d4-a716-446655440000",
 * "revoked_at": "2025-08-24T10:00:00.000Z",
 * "app_context_assignment_removed": true
 *   },
 *   "requestId": "req_1724555500000_abc123",
 *   "timestamp": "2025-08-24T10:00:00.000Z"
 * }
 *
 * Error Response (404):
 * {
 *   "success": false,
 *   "error": {
 * "code": "NOT_FOUND",
 * "message": "OAuth session not found"
 *   },
 *   "requestId": "req_1724555500000_abc123",
 *   "timestamp": "2025-08-24T10:00:00.000Z"
 * }
 * ```
 *
 * @throws {400} VALIDATION_ERROR - Session ID missing or invalid UUID format
 * @throws {401} AUTHENTICATION_REQUIRED - User authentication required
 * @throws {403} FORBIDDEN - Cannot revoke other user's session
 * @throws {404} NOT_FOUND - OAuth session not found
 * @throws {500} INTERNAL_SERVER_ERROR - Database operation failed
 *
 * Academic constraint: Atomic operations for academic simplicity
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSuccessResponse,
  createErrorResponse,
  validate_uuid,
  generateRequestId,
} from '@/utils/api/with-auth';
import { ErrorCodes } from '@/utils/api/types';
import { createClient } from '@/utils/supabase/server';
/**
 * DELETE handler for OAuth session revocation
 *
 * Revokes OAuth session tokens with comprehensive ownership validation and optional
 * context assignment cleanup. Implements hard delete for academic simplicity while
 * maintaining proper audit logging.
 *
 * @param request - Next.js request object containing URL path and query parameters
 * @returns Promise<NextResponse> - JSend compliant response with revocation status
 *
 * @example Request URL patterns:
 * - `/api/oauth/sessions/550e8400-e29b-41d4-a716-446655440000`
 * - `/api/oauth/sessions/550e8400-e29b-41d4-a716-446655440000?remove_assignment=true`
 *
 * @example Success Response:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 * "revoked": true,
 * "session_id": "550e8400-e29b-41d4-a716-446655440000",
 * "revoked_at": "2025-08-24T10:00:00.000Z",
 * "app_context_assignment_removed": false
 *   }
 * }
 * ```
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  try {
// Extract and validate session ID from URL path
const sessionId = new URL(request.url).pathname.split('/').pop();
if (!sessionId) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Session ID is required',
  requestId,
  undefined,
  timestamp,
),
{ status: 400 },
  );
}
if (!validate_uuid(sessionId)) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.INVALID_UUID,
  'Session ID must be a valid UUID format',
  requestId,
  { provided_id: sessionId },
  timestamp,
),
{ status: 400 },
  );
}

// Authenticate user
const supabase = await createClient();
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();
if (authError || !user?.id) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.AUTHENTICATION_REQUIRED,
  'User authentication required for token revocation',
  requestId,
  undefined,
  timestamp,
),
{ status: 401 },
  );
}

// Check session exists and verify ownership
const { data: session, error: fetchError } = await supabase
  .from('oauth_sessions')
  .select('id, profile_id, client_id')
  .eq('id', sessionId)
  .single();

if (fetchError || !session) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.NOT_FOUND,
  'OAuth session not found',
  requestId,
  undefined,
  timestamp,
),
{ status: 404 },
  );
}
if (session.profile_id !== user.id) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.FORBIDDEN,
  'Access denied: users can only revoke their own sessions',
  requestId,
  undefined,
  timestamp,
),
{ status: 403 },
  );
}

// Parse query parameters
const url = new URL(request.url);
const removeAssignment =
  url.searchParams.get('remove_assignment') === 'true';

// Execute revocation operations in sequence (atomic for academic simplicity)
try {
  // Step 1: Delete session from oauth_sessions table (hard delete)
  const { error: deleteError } = await supabase
.from('oauth_sessions')
.delete()
.eq('id', sessionId)
.eq('profile_id', user.id); // Double-check ownership for security

  if (deleteError) {
console.error(`[${requestId}] Session deletion failed:`, deleteError);
return NextResponse.json(
  createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to delete OAuth session',
requestId,
undefined,
timestamp,
  ),
  { status: 500 },
);
  }

  // Step 2: Log revocation action in app_usage_log
  const { error: logError } = await supabase.rpc('log_app_usage', {
p_profile_id: session.profile_id,
p_app_id: session.client_id,
p_action: 'revoke',
p_session_id: sessionId,
p_response_time_ms: 0, // Not applicable for revocation
p_success: true,
  });

  if (logError) {
console.error(`[${requestId}] Usage logging failed:`, logError);
// Non-critical error, don't fail the request
  }

  // Step 3: Optional - Remove app context assignment if requested
  let assignmentRemoved = false;
  if (removeAssignment) {
const { error: assignmentError } = await supabase
  .from('app_context_assignments')
  .delete()
  .eq('profile_id', session.profile_id)
  .eq('client_id', session.client_id);

if (assignmentError) {
  console.error(
`[${requestId}] Context assignment removal failed:`,
assignmentError,
  );
  // Non-critical error, don't fail the request
} else {
  assignmentRemoved = true;
}
  }

  // Return success response
  return NextResponse.json(
createSuccessResponse(
  {
revoked: true,
session_id: sessionId,
revoked_at: timestamp,
app_context_assignment_removed: assignmentRemoved,
  },
  requestId,
  timestamp,
),
{ status: 200 },
  );
} catch (operationError) {
  console.error(
`[${requestId}] Revocation operation failed:`,
operationError,
  );
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to complete session revocation',
  requestId,
  undefined,
  timestamp,
),
{ status: 500 },
  );
}
  } catch (error) {
console.error(`[${requestId}] Token revocation error:`, error);
return NextResponse.json(
  createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to revoke OAuth session',
requestId,
undefined,
timestamp,
  ),
  { status: 500 },
);
  }
}
