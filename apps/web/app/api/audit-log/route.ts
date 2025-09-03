import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';
import { z } from 'zod';
// Note: Tables import removed as we handle joined query data directly

// Note: AppUsageLogEntry type removed as we now handle joined data from query

// Transform app_usage_log entry to match UI expectations
interface TransformedAuditLogEntry {
  id: number;
  accessed_at: string; // mapped from created_at
  action: string;
  client_id: string;
  session_id: string | null;
  context_id: string | null;
  success: boolean;
  error_type: string | null;
  response_time_ms: number | null;
  // Human-readable fields from joins
  app_display_name: string | null;
  publisher_domain: string | null;
  context_name: string | null;
  // Fields that don't exist in app_usage_log but UI might expect
  resolved_name_id: null;
  target_user_id: string | null; // mapped from profile_id or user_id
}

interface AuditLogResponse {
  entries: TransformedAuditLogEntry[];
  pagination: {
total: number;
limit: number;
offset: number;
hasMore: boolean;
  };
}

const QueryParamsSchema = z.object({
  limit: z
.string()
.nullable()
.optional()
.transform((val) => {
  if (!val) return 20; // default
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 100) {
return 20; // return default for invalid values
  }
  return parsed;
}),
  offset: z
.string()
.nullable()
.optional()
.transform((val) => {
  if (!val) return 0; // default
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed < 0) {
return 0; // return default for invalid values
  }
  return parsed;
}),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

const handleGet: AuthenticatedHandler<AuditLogResponse> = async (
  request,
  context,
) => {
  const startTime = Date.now();
  const url = new URL(request.url);

  // Parse and validate query parameters
  const parseResult = QueryParamsSchema.safeParse({
limit: url.searchParams.get('limit'),
offset: url.searchParams.get('offset'),
startDate: url.searchParams.get('startDate'),
endDate: url.searchParams.get('endDate'),
  });

  if (!parseResult.success) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid query parameters',
  context.requestId,
  parseResult.error.issues.map((issue) => issue.message).join(', '),
  context.timestamp,
);
  }

  const { limit, offset, startDate, endDate } = parseResult.data;

  // Validate date formats if provided
  if (startDate && isNaN(Date.parse(startDate))) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid start date format',
  context.requestId,
  'Start date must be a valid ISO date string',
  context.timestamp,
);
  }

  if (endDate && isNaN(Date.parse(endDate))) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid end date format',
  context.requestId,
  'End date must be a valid ISO date string',
  context.timestamp,
);
  }

  try {
// Query both app_usage_log and auth_events tables in parallel
const [appUsageResult, authEventsResult] = await Promise.all([
  // Query app_usage_log table
  (() => {
let query = context.supabase
  .from('app_usage_log')
  .select('*')
  .eq('profile_id', context.user!.id);

// Apply date filtering if provided
if (startDate) {
  query = query.gte('created_at', startDate);
}
if (endDate) {
  query = query.lte('created_at', endDate);
}

return query;
  })(),

  // Query auth_events table
  (() => {
let query = context.supabase
  .from('auth_events')
  .select('*')
  .eq('user_id', context.user!.id);

// Apply date filtering if provided
if (startDate) {
  query = query.gte('created_at', startDate);
}
if (endDate) {
  query = query.lte('created_at', endDate);
}

return query;
  })(),
]);

if (appUsageResult.error) {
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve app usage log entries',
context.requestId,
appUsageResult.error.message,
context.timestamp,
  );
}

if (authEventsResult.error) {
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve auth events',
context.requestId,
authEventsResult.error.message,
context.timestamp,
  );
}

// Combine and sort all entries by created_at
const allRawEntries = [
  ...(appUsageResult.data || []).map((entry) => ({
...entry,
source: 'app_usage_log' as const,
  })),
  ...(authEventsResult.data || []).map((entry) => ({
...entry,
source: 'auth_events' as const,
  })),
].sort(
  (a, b) =>
new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
);

// Apply pagination to combined results
const paginatedEntries = allRawEntries.slice(offset, offset + limit);
const total = allRawEntries.length;
const rawEntries = paginatedEntries;
const hasMore = offset + limit < total;

// Get unique client IDs and context IDs for lookup (only from app_usage_log entries)
const clientIds = Array.from(
  new Set(
rawEntries
  ?.filter((e) => e.source === 'app_usage_log')
  .map((e) => e.client_id)
  .filter(Boolean) || [],
  ),
);
const contextIds = Array.from(
  new Set(
rawEntries
  ?.filter((e) => e.source === 'app_usage_log')
  ?.map((e) => e.context_id)
  .filter((id): id is string => Boolean(id)) || [],
  ),
);

// Fetch client registry data
const clientData: Record<
  string,
  { display_name: string; publisher_domain: string }
> = {};
if (clientIds.length > 0) {
  const { data: clients } = await context.supabase
.from('oauth_client_registry')
.select('client_id, display_name, publisher_domain')
.in('client_id', clientIds);

  clients?.forEach((client) => {
clientData[client.client_id] = {
  display_name: client.display_name,
  publisher_domain: client.publisher_domain,
};
  });
}

// Fetch context data
const contextData: Record<string, { name: string }> = {};
if (contextIds.length > 0) {
  const { data: contexts } = await context.supabase
.from('user_contexts')
.select('id, context_name')
.in('id', contextIds)
.eq('user_id', context.user!.id); // Ensure user owns the contexts

  contexts?.forEach((ctx) => {
contextData[ctx.id] = { name: ctx.context_name };
  });
}

// Transform entries from both tables to match UI expectations
const transformedEntries: TransformedAuditLogEntry[] = (
  rawEntries || []
).map((entry) => {
  if (entry.source === 'app_usage_log') {
// Transform app_usage_log entries
return {
  id: entry.id,
  accessed_at: entry.created_at, // Map created_at to accessed_at for UI compatibility
  action: entry.action,
  client_id: entry.client_id,
  session_id: entry.session_id,
  context_id: entry.context_id,
  success: entry.success,
  error_type: entry.error_type,
  response_time_ms: entry.response_time_ms,
  // Human-readable fields from separate queries
  app_display_name: clientData[entry.client_id]?.display_name || null,
  publisher_domain:
clientData[entry.client_id]?.publisher_domain || null,
  context_name: entry.context_id
? contextData[entry.context_id]?.name || null
: null,
  // Fields that don't exist in app_usage_log but UI might expect
  resolved_name_id: null,
  target_user_id: entry.profile_id, // Map profile_id to target_user_id for UI compatibility
};
  } else {
// Transform auth_events entries
return {
  id: entry.id,
  accessed_at: entry.created_at, // Map created_at to accessed_at for UI compatibility
  action: entry.event_type, // Map event_type to action
  client_id: 'auth', // Special identifier for auth events
  session_id: entry.session_id,
  context_id: null, // Auth events don't have contexts
  success: entry.success,
  error_type: entry.error_message,
  response_time_ms: null, // Auth events don't track response time
  // Human-readable fields for auth events
  app_display_name: 'TrueNamePath Authentication', // Special name for auth events
  publisher_domain: null,
  context_name: null,
  // Fields that don't exist in auth_events but UI might expect
  resolved_name_id: null,
  target_user_id: entry.user_id, // Map user_id to target_user_id for UI compatibility
};
  }
});

const response: AuditLogResponse = {
  entries: transformedEntries,
  pagination: {
total,
limit,
offset,
hasMore,
  },
};

const responseTime = Date.now() - startTime;

// Log performance metrics for monitoring
if (responseTime > 500) {
  console.warn(
`Slow app usage log API response: ${responseTime}ms for user ${context.user!.id}`,
  );
}

return createSuccessResponse(
  response,
  context.requestId,
  context.timestamp,
);
  } catch (error) {
return createErrorResponse(
  ErrorCodes.INTERNAL_ERROR,
  'An unexpected error occurred while retrieving app usage log entries',
  context.requestId,
  error instanceof Error ? error.message : 'Unknown error',
  context.timestamp,
);
  }
};

export const GET = withRequiredAuth(handleGet);
