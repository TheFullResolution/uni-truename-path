// TrueNamePath: OAuth Applications List Endpoint
// GET /api/oauth/applications - Retrieve all active OAuth applications for authorization flows
// Date: August 23, 2025
// Academic project OAuth integration - supports E2E testing and application discovery

import { NextRequest } from 'next/server';
import {
  withOptionalAuth,
  createSuccessResponse,
  createErrorResponse,
} from '@/utils/api/with-auth';
import { ErrorCodes, StandardResponse } from '@/utils/api/types';
import type { AuthenticatedContext } from '@/utils/api/with-auth';

interface OAuthApplication {
  id: string;
  app_name: string;
  display_name: string;
  description: string | null;
  redirect_uri: string;
  app_type: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * GET /api/oauth/applications
 *
 * Public endpoint to retrieve all active OAuth applications.
 * Used for OAuth authorization flows and application discovery.
 *
 * Returns:
 * - Array of active OAuth applications
 * - Includes demo-hr and demo-chat applications
 * - Cached response for performance
 */
async function handleApplicationsList(
  request: NextRequest,
  { supabase, requestId, timestamp }: AuthenticatedContext,
): Promise<StandardResponse<OAuthApplication[]>> {
  try {
// Query all active OAuth applications
const { data: applications, error } = await supabase
  .from('oauth_applications')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: true });

if (error) {
  console.error(
`[${requestId}] Database error fetching applications:`,
error,
  );
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve OAuth applications',
requestId,
undefined,
timestamp,
  );
}

// Return empty array if no applications found (not an error)
const apps = applications || [];

console.log(
  `[${requestId}] Retrieved ${apps.length} active OAuth applications`,
);

return createSuccessResponse(apps, requestId, timestamp);
  } catch (error) {
console.error(`[${requestId}] OAuth applications lookup error:`, error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to retrieve OAuth applications',
  requestId,
  undefined,
  timestamp,
);
  }
}

/**
 * GET /api/oauth/applications
 * Public endpoint wrapped with withOptionalAuth for OAUTH_PUBLIC security level
 */
export const GET = withOptionalAuth(handleApplicationsList);
