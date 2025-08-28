// OAuth App Registration Endpoint
// GET /api/oauth/apps/[appName] - Secure OAuth client ID generation with domain validation
// Date: August 25, 2025
// Academic project OAuth integration with client registry system

import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/utils/api/with-auth';
import {
  createErrorResponse,
  createSuccessResponse,
  AuthenticatedContext,
  handle_method_not_allowed,
} from '@/utils/api';
import { AppNameSchema } from '@/app/api/oauth/schemas';
import {
  OAuthErrorCodes,
  type OAuthClientRegistryInfo,
} from '@/app/api/oauth/types';
import { ErrorCodes } from '@/utils/api/types';
import {
  lookupExistingClient,
  updateClientUsage,
  createNewClientWithRetry,
} from '@/utils/oauth/registry-service';
import { createCORSOptionsResponse } from '@/utils/api/cors';

/**
 * Extracts domain from Origin header with Referer fallback
 * Uses Origin first, falls back to Referer for browser navigation
 */
function extractDomain(request: NextRequest): string | null {
  // Try Origin header first (preferred for CORS requests)
  const origin = request.headers.get('origin');
  if (origin) {
try {
  return new URL(origin).hostname;
} catch {
  // Invalid Origin format, continue to fallback
}
  }

  // Fallback to Referer header (for browser navigation)
  const referer = request.headers.get('referer');
  if (referer) {
try {
  return new URL(referer).hostname;
} catch {
  // Invalid Referer format
  return null;
}
  }

  return null;
}

/**
 * GET /api/oauth/apps/[appName]
 * Secure OAuth client ID generation with domain-based registry
 * Returns existing client_id or creates new one with collision detection
 *
 * @param request - Next.js request object with Origin header required
 * @param context - Authenticated context from withOptionalAuth
 * @returns OAuth client registry information in JSend format
 */
async function handleGet(
  request: NextRequest,
  { requestId, timestamp }: AuthenticatedContext,
) {
  try {
// Extract and validate domain (Origin or Referer header required)
const domain = extractDomain(request);

if (!domain) {
  return createErrorResponse(
OAuthErrorCodes.MISSING_ORIGIN_HEADER,
'Origin or Referer header is required for client registration',
requestId,
undefined,
timestamp,
  );
}

// Validate domain format
if (!/^[a-z0-9]([a-z0-9\-.]*[a-z0-9])?$/.test(domain)) {
  return createErrorResponse(
OAuthErrorCodes.INVALID_DOMAIN_FORMAT,
'Invalid domain format in Origin header',
requestId,
undefined,
timestamp,
  );
}

// Extract and validate app name from URL
const url = new URL(request.url);
const appName = url.pathname.split('/').pop();

if (!appName) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'App name is required',
requestId,
undefined,
timestamp,
  );
}

// Validate app name format
const appNameValidation = AppNameSchema.safeParse(appName);
if (!appNameValidation.success) {
  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid app name format',
requestId,
appNameValidation.error.issues.map((issue) => ({
  field: 'appName',
  message: issue.message,
  code: issue.code,
})),
timestamp,
  );
}

return await handleClientRegistration(
  domain,
  appNameValidation.data,
  requestId,
  timestamp,
);
  } catch (error) {
console.error(`[${requestId}] Client registration error:`, error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to process client registration',
  requestId,
  undefined,
  timestamp,
);
  }
}

/**
 * Handles client registry lookup and creation
 */
async function handleClientRegistration(
  domain: string,
  appName: string,
  requestId: string,
  timestamp: string,
) {
  // Check for existing client registration
  const { data: existingClient, error: lookupError } =
await lookupExistingClient(domain, appName);

  if (lookupError) {
console.error(`[${requestId}] Registry lookup error:`, lookupError);
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to check client registry',
  requestId,
  undefined,
  timestamp,
);
  }

  if (existingClient) {
// Update last_used_at and return existing client
await updateClientUsage(existingClient.client_id);

const clientInfo: OAuthClientRegistryInfo = {
  client_id: existingClient.client_id,
  display_name: existingClient.display_name,
  app_name: existingClient.app_name,
  publisher_domain: existingClient.publisher_domain,
  created_at: existingClient.created_at,
  last_used_at: new Date().toISOString(),
};

return createSuccessResponse({ client: clientInfo }, requestId, timestamp);
  }

  // Create new client with collision retry
  const { data: newClient, error: createError } =
await createNewClientWithRetry(domain, appName, requestId);

  if (createError || !newClient) {
console.error(`[${requestId}] Client creation failed:`, createError);
return createErrorResponse(
  OAuthErrorCodes.CLIENT_ID_GENERATION_FAILED,
  'Failed to generate unique client ID after multiple attempts',
  requestId,
  undefined,
  timestamp,
);
  }

  const clientInfo: OAuthClientRegistryInfo = {
client_id: newClient.client_id,
display_name: newClient.display_name,
app_name: newClient.app_name,
publisher_domain: newClient.publisher_domain,
created_at: newClient.created_at,
last_used_at: newClient.last_used_at,
  };

  return createSuccessResponse({ client: clientInfo }, requestId, timestamp);
}

// Export GET handler with optional auth for OAUTH_PUBLIC security level
export const GET = withOptionalAuth(handleGet);

// Handle unsupported HTTP methods
export const POST = () => handle_method_not_allowed(['GET']);
export const PUT = () => handle_method_not_allowed(['GET']);
export const DELETE = () => handle_method_not_allowed(['GET']);
export const PATCH = () => handle_method_not_allowed(['GET']);

/**
 * OPTIONS handler for CORS preflight requests
 * Required for cross-origin requests from demo-hr app
 */
export async function OPTIONS(): Promise<Response> {
  return createCORSOptionsResponse('GET, OPTIONS');
}
