// OAuth App Registration Endpoint
// GET /api/oauth/apps/[appName] - Retrieve OAuth application metadata for authorization flows
// Date: August 23, 2025
// Academic project OAuth integration with public access for demo applications

import { AppNameSchema } from '@/app/api/oauth/schemas';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCodes,
  handle_method_not_allowed,
} from '@/utils/api';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/oauth/apps/[appName]
 * Public endpoint for OAuth application discovery
 *
 * @param request - Next.js request object
 * @returns OAuth application metadata in JSend format
 */
export async function GET(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const timestamp = new Date().toISOString();

  try {
// Extract app name from URL path
const url = new URL(request.url);
const appName = url.pathname.split('/').pop();

if (!appName) {
  const errorResponse = createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'App name is required',
requestId,
undefined,
timestamp,
  );
  return NextResponse.json(errorResponse, { status: 400 });
}

// Validate app name format using Zod schema
const validation = AppNameSchema.safeParse(appName);
if (!validation.success) {
  const errorResponse = createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid app name format',
requestId,
validation.error.issues.map((issue) => ({
  field: 'appName',
  message: issue.message,
  code: issue.code,
})),
timestamp,
  );
  return NextResponse.json(errorResponse, { status: 400 });
}

// Query database for active application
const supabase = await createClient();
const { data: app, error } = await supabase
  .from('oauth_applications')
  .select('*')
  .eq('app_name', validation.data)
  .eq('is_active', true)
  .maybeSingle();

if (error) {
  console.error(`[${requestId}] Database error:`, error);
  const errorResponse = createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve application information',
requestId,
undefined,
timestamp,
  );
  return NextResponse.json(errorResponse, { status: 500 });
}

if (!app) {
  const errorResponse = createErrorResponse(
ErrorCodes.APP_NOT_FOUND,
'OAuth application not found or inactive',
requestId,
undefined,
timestamp,
  );
  return NextResponse.json(errorResponse, { status: 404 });
}

// Create success response with caching headers for performance
const responseData = createSuccessResponse(app, requestId, timestamp);

// Return NextResponse with 5-minute caching for CDN optimization
return NextResponse.json(responseData, {
  status: 200,
  headers: {
'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes
'Vary': 'Accept-Encoding',
  },
});
  } catch (error) {
console.error(`[${requestId}] OAuth app lookup error:`, error);
const errorResponse = createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to retrieve application information',
  requestId,
  undefined,
  timestamp,
);
return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle unsupported HTTP methods
export const POST = () => handle_method_not_allowed(['GET']);
export const PUT = () => handle_method_not_allowed(['GET']);
export const DELETE = () => handle_method_not_allowed(['GET']);
export const PATCH = () => handle_method_not_allowed(['GET']);
