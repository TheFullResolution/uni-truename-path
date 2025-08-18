// TrueNamePath: Consent Management API Route
import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  handle_method_not_allowed,
  type AuthenticatedHandler,
} from '@/utils/api';
import { z } from 'zod';

const consent_schema = z.discriminatedUnion('action', [
  z.object({
action: z.literal('request'),
granter_user_id: z.uuid(),
requester_user_id: z.uuid(),
context_name: z.string().min(1).max(100),
expires_at: z.string().datetime().optional(),
  }),
  z.object({
action: z.literal('grant'),
granter_user_id: z.uuid(),
requester_user_id: z.uuid(),
  }),
  z.object({
action: z.literal('revoke'),
granter_user_id: z.uuid(),
requester_user_id: z.uuid(),
  }),
]);

interface consent_response {
  granter_user_id: string;
  requester_user_id: string;
  message: string;
  timestamp: string;
  consent_id?: string;
  status?: 'PENDING';
  context_name?: string;
  expires_at?: string;
  granted?: boolean;
  revoked?: boolean;
}

const handle_consent_request: AuthenticatedHandler<consent_response> = async (
  request: NextRequest,
  context,
) => {
  let body: unknown;
  try {
body = await request.json();
  } catch {
return createErrorResponse(
  'INVALID_JSON',
  'Invalid JSON',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  const result = consent_schema.safeParse(body);
  if (!result.success) {
return createErrorResponse(
  'VALIDATION_ERROR',
  'Invalid parameters',
  context.requestId,
  result.error.issues,
  context.timestamp,
);
  }

  const params = result.data;

  if (!context.user) {
return createErrorResponse(
  'AUTH_REQUIRED',
  'Authentication required',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  const is_authorized =
params.granter_user_id === context.user.id ||
params.requester_user_id === context.user.id;
  if (!is_authorized) {
return createErrorResponse(
  'AUTH_FAILED',
  'Not authorized',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  const supabase = context.supabase;

  switch (params.action) {
case 'request': {
  if (params.granter_user_id === params.requester_user_id) {
return createErrorResponse(
  'VALIDATION_ERROR',
  'Cannot request consent from yourself',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  const { data: consent_id, error } = await supabase.rpc(
'request_consent',
{
  p_granter_user_id: params.granter_user_id,
  p_requester_user_id: params.requester_user_id,
  p_context_name: params.context_name,
  p_expires_at: params.expires_at,
},
  );

  if (error) {
return createErrorResponse(
  'RPC_ERROR',
  'Request failed',
  context.requestId,
  error.message,
  context.timestamp,
);
  }

  return createSuccessResponse(
{
  consent_id: consent_id as string,
  status: 'PENDING' as const,
  granter_user_id: params.granter_user_id,
  requester_user_id: params.requester_user_id,
  context_name: params.context_name,
  expires_at: params.expires_at,
  timestamp: context.timestamp,
  message: 'Consent requested',
},
context.requestId,
context.timestamp,
  );
}

case 'grant': {
  const { data: granted, error } = await supabase.rpc('grant_consent', {
p_granter_user_id: params.granter_user_id,
p_requester_user_id: params.requester_user_id,
  });

  if (error) {
return createErrorResponse(
  'RPC_ERROR',
  'Grant failed',
  context.requestId,
  error.message,
  context.timestamp,
);
  }

  if (!granted) {
return createErrorResponse(
  'NOT_FOUND',
  'No consent to grant',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  return createSuccessResponse(
{
  granted: true,
  granter_user_id: params.granter_user_id,
  requester_user_id: params.requester_user_id,
  timestamp: context.timestamp,
  message: 'Consent granted',
},
context.requestId,
context.timestamp,
  );
}

case 'revoke': {
  const { data: revoked, error } = await supabase.rpc('revoke_consent', {
p_granter_user_id: params.granter_user_id,
p_requester_user_id: params.requester_user_id,
  });

  if (error) {
return createErrorResponse(
  'RPC_ERROR',
  'Revoke failed',
  context.requestId,
  error.message,
  context.timestamp,
);
  }

  if (!revoked) {
return createErrorResponse(
  'NOT_FOUND',
  'No consent to revoke',
  context.requestId,
  undefined,
  context.timestamp,
);
  }

  return createSuccessResponse(
{
  revoked: true,
  granter_user_id: params.granter_user_id,
  requester_user_id: params.requester_user_id,
  timestamp: context.timestamp,
  message: 'Consent revoked',
},
context.requestId,
context.timestamp,
  );
}

default:
  return createErrorResponse(
'VALIDATION_ERROR',
'Invalid action',
context.requestId,
undefined,
context.timestamp,
  );
  }
};

export const POST = withRequiredAuth(handle_consent_request);

/**
 * Handle unsupported HTTP methods using shared utility
 */
export const GET = () => handle_method_not_allowed(['POST']);
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
status: 200,
headers: {
  'Allow': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
},
  });
}
