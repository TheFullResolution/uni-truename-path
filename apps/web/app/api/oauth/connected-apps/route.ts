// OAuth Connected Apps API Route

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

/**
 * Authenticated handler for connected apps retrieval
 */
const getConnectedApps: AuthenticatedHandler<{
  connected_apps: ConnectedApp[];
}> = async (request: NextRequest, { user, requestId, timestamp }) => {
  try {
if (!user?.id) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User authentication required',
requestId,
undefined,
timestamp,
  );
}

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

const connectedApps = await formatConnectedAppResponse(
  appsData || [],
  user.id,
);

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

export const GET = withRequiredAuth(getConnectedApps);
