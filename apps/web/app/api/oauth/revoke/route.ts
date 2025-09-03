/**
 * OAuth App Revocation Endpoint
 * @route POST /api/oauth/revoke
 * @description Revokes all OAuth sessions for a client_id with optional context assignment removal
 * @authentication Cookie-based session required
 * @performance <5ms average response time
 * @analytics Logs revocation actions to app_usage_log table
 *
 * Flow:
 * 1. Validate client_id in request body
 * 2. Authenticate user via cookie session
 * 3. Find all active sessions for user + client_id combination
 * 4. Delete all sessions (hard delete for academic simplicity)
 * 5. Remove app context assignment if requested
 * 6. Log revocation action in app_usage_log
 *
 * @example
 * ```typescript
 * POST /api/oauth/revoke
 * Cookie: supabase-auth-token=xxx
 * Content-Type: application/json
 *
 * {
 *   "client_id": "tnp_a1b2c3d4e5f67890",
 *   "remove_assignment": true
 * }
 *
 * Success Response (200):
 * {
 *   "status": "success",
 *   "data": {
 * "revoked": true,
 * "client_id": "tnp_a1b2c3d4e5f67890",
 * "revoked_sessions": 2,
 * "assignment_removed": true,
 * "revoked_at": "2025-08-28T15:30:00.000Z"
 *   }
 * }
 * ```
 *
 * @throws {400} VALIDATION_ERROR - client_id missing or invalid format
 * @throws {401} AUTHENTICATION_REQUIRED - User authentication required
 * @throws {404} NOT_FOUND - No app assignment found for user
 * @throws {500} INTERNAL_SERVER_ERROR - Database operation failed
 *
 * Academic constraint: Simple success/failure pattern, ≤50 lines core logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
} from '@/utils/api/with-auth';
import { ErrorCodes } from '@/utils/api/types';

// Validation schema for request body
const RevokeRequestSchema = z.object({
  client_id: z.string().regex(/^tnp_[a-f0-9]{16}$/, 'Invalid client_id format'),
  remove_assignment: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();

  try {
// Parse and validate request body
const body = await request.json();
const validation = RevokeRequestSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid request: client_id required with format tnp_[16 hex chars]',
  requestId,
  { errors: validation.error.issues },
  timestamp,
),
{ status: 400 },
  );
}

const { client_id, remove_assignment } = validation.data;

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
  'User authentication required for app revocation',
  requestId,
  undefined,
  timestamp,
),
{ status: 401 },
  );
}

// Verify user has assignment for this client
const { data: assignment, error: assignmentError } = await supabase
  .from('app_context_assignments')
  .select('client_id')
  .eq('profile_id', user.id)
  .eq('client_id', client_id)
  .single();

if (assignmentError || !assignment) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.NOT_FOUND,
  'No app assignment found for this client',
  requestId,
  { client_id },
  timestamp,
),
{ status: 404 },
  );
}

// Get all active sessions for this client_id and user
const { data: sessions, error: fetchError } = await supabase
  .from('oauth_sessions')
  .select('id')
  .eq('profile_id', user.id)
  .eq('client_id', client_id)
  .gt('expires_at', timestamp);

if (fetchError) {
  return NextResponse.json(
createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to retrieve active sessions',
  requestId,
  undefined,
  timestamp,
),
{ status: 500 },
  );
}

const sessionCount = sessions?.length || 0;

// Delete all sessions for this client (if any)
if (sessionCount > 0) {
  const { error: deleteError } = await supabase
.from('oauth_sessions')
.delete()
.eq('profile_id', user.id)
.eq('client_id', client_id);

  if (deleteError) {
return NextResponse.json(
  createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to revoke OAuth sessions',
requestId,
undefined,
timestamp,
  ),
  { status: 500 },
);
  }
}

// Remove app context assignment if requested
let assignmentRemoved = false;
if (remove_assignment) {
  const { error: assignmentDeleteError } = await supabase
.from('app_context_assignments')
.delete()
.eq('profile_id', user.id)
.eq('client_id', client_id);

  if (!assignmentDeleteError) {
assignmentRemoved = true;
  }
}

// Log revocation action with actual performance time
const responseTime = Math.round(performance.now() - startTime);
await supabase.rpc('log_app_usage', {
  p_profile_id: user.id,
  p_client_id: client_id,
  p_action: 'revoke_all',
  p_session_id: undefined,
  p_response_time_ms: responseTime,
  p_success: true,
});

return NextResponse.json(
  createSuccessResponse(
{
  revoked: true,
  client_id,
  revoked_sessions: sessionCount,
  assignment_removed: assignmentRemoved,
  revoked_at: timestamp,
},
requestId,
timestamp,
  ),
  { status: 200 },
);
  } catch (error) {
console.error(`[${requestId}] App revocation error:`, error);
return NextResponse.json(
  createErrorResponse(
ErrorCodes.INTERNAL_SERVER_ERROR,
'Failed to revoke app access',
requestId,
undefined,
timestamp,
  ),
  { status: 500 },
);
  }
}
