// TrueNamePath: OAuth Connected Apps API Route
// GET /api/oauth/connected-apps - Retrieve user's connected OAuth applications with pagination
// Date: August 28, 2025 - Step 16.6.1 implementation
// Academic project REST API with JSend compliance and INTERNAL_APP security

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '@/utils/api';
import { ErrorCodes } from '@/utils/api';
import {
  getConnectedAppsForUser,
  formatConnectedAppResponse,
} from '@/utils/oauth/connected-apps-service';
import type { ConnectedApp } from '@/types/oauth';

// Simplified for academic project - no query parameters needed

/**
 * Authenticated handler for connected apps retrieval (simplified for academic project)
 * Returns user's OAuth applications with context assignments and usage statistics
 */
const getConnectedApps: AuthenticatedHandler<{
  connected_apps: ConnectedApp[];
}> = async (request: NextRequest, { user, requestId, timestamp }) => {
  try {
// Validate user authentication
if (!user?.id) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
requestId,
undefined,
timestamp,
  );
}

// Simplified for academic project - no pagination needed

// Get connected apps using service layer
const { data: appsData, error } = await getConnectedAppsForUser(user.id);

if (error) {
  console.error(`[${requestId}] Failed to retrieve connected apps:`, error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve connected applications',
requestId,
undefined,
timestamp,
  );
}

// Format response data with usage statistics
const connectedApps = await formatConnectedAppResponse(
  appsData || [],
  user.id,
);

// Simplified response for academic project - no pagination needed
const responseData = {
  connected_apps: connectedApps,
};

return createSuccessResponse(responseData, requestId, timestamp);
  } catch (error) {
console.error(`[${requestId}] Connected apps retrieval error:`, error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to retrieve connected applications',
  requestId,
  undefined,
  timestamp,
);
  }
};

// Export GET handler with INTERNAL_APP security level (full headers for dashboard use)
export const GET = withRequiredAuth(getConnectedApps);
