import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
  ErrorCodes,
} from '@/utils/api';
import { z } from 'zod';
import type {
  ActivityTimelineResponse,
  OAuthEvent,
  ActivityEvent,
} from '@/types/database';

// Query parameters schema
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
  event_types: z
.string()
.nullable()
.optional()
.transform((val) => {
  if (!val) return ['oauth', 'auth', 'data_change'] as const;
  try {
const types = val
  .split(',')
  .filter((t) => ['oauth', 'auth', 'data_change'].includes(t));
return types.length > 0 ? types : ['oauth', 'auth', 'data_change'];
  } catch {
return ['oauth', 'auth', 'data_change'] as const;
  }
}),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  search_query: z.string().nullable().optional(),
});

const handleGet: AuthenticatedHandler<ActivityTimelineResponse> = async (
  request,
  context,
) => {
  const startTime = Date.now();
  const url = new URL(request.url);

  // Parse and validate query parameters
  const parseResult = QueryParamsSchema.safeParse({
limit: url.searchParams.get('limit'),
offset: url.searchParams.get('offset'),
event_types: url.searchParams.get('event_types'),
start_date: url.searchParams.get('start_date'),
end_date: url.searchParams.get('end_date'),
search_query: url.searchParams.get('search_query'),
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

  const { limit, offset, event_types, start_date, end_date, search_query } =
parseResult.data;

  // Validate date formats if provided
  if (start_date && isNaN(Date.parse(start_date))) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid start date format',
  context.requestId,
  'Start date must be a valid ISO date string',
  context.timestamp,
);
  }

  if (end_date && isNaN(Date.parse(end_date))) {
return createErrorResponse(
  ErrorCodes.VALIDATION_ERROR,
  'Invalid end date format',
  context.requestId,
  'End date must be a valid ISO date string',
  context.timestamp,
);
  }

  try {
const allEvents: Array<{
  timestamp: string;
  data: ActivityEvent;
}> = [];

// Query OAuth events (app_usage_log) if requested
if (event_types.includes('oauth')) {
  let oauthQuery = context.supabase
.from('app_usage_log')
.select('*')
.eq('profile_id', context.user!.id);

  // Apply date filtering
  if (start_date) oauthQuery = oauthQuery.gte('created_at', start_date);
  if (end_date) oauthQuery = oauthQuery.lte('created_at', end_date);

  const { data: oauthData, error: oauthError } = await oauthQuery;

  if (oauthError) {
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to retrieve OAuth events',
  context.requestId,
  oauthError.message,
  context.timestamp,
);
  }

  // Transform OAuth events
  oauthData?.forEach((event) => {
const oauthEvent: OAuthEvent = {
  type: 'oauth',
  id: event.id.toString(),
  timestamp: event.created_at,
  user_id: event.profile_id,
  action: event.action,
  client_id: event.client_id,
  session_id: event.session_id,
  context_id: event.context_id,
  success: event.success,
  error_type: event.error_type,
  response_time_ms: event.response_time_ms,
  profile_id: event.profile_id,
};

allEvents.push({
  timestamp: event.created_at,
  data: oauthEvent,
});
  });
}

// Query Authentication events (auth_events) if requested
if (event_types.includes('auth')) {
  let authQuery = context.supabase
.from('auth_events')
.select('*')
.eq('user_id', context.user!.id);

  // Apply date filtering
  if (start_date) authQuery = authQuery.gte('created_at', start_date);
  if (end_date) authQuery = authQuery.lte('created_at', end_date);

  const { data: authData, error: authError } = await authQuery;

  if (authError) {
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to retrieve authentication events',
  context.requestId,
  authError.message,
  context.timestamp,
);
  }

  // Transform authentication events
  authData?.forEach((event) => {
const authEvent: ActivityEvent = {
  type: 'auth',
  id: event.id.toString(),
  timestamp: event.created_at,
  user_id: event.user_id || context.user!.id,
  event_type: event.event_type,
  ip_address: event.ip_address as string | null,
  user_agent: event.user_agent,
  success: event.success,
  error_message: event.error_message,
  session_id: event.session_id,
  metadata: event.metadata as Record<string, unknown>,
};

allEvents.push({
  timestamp: event.created_at,
  data: authEvent,
});
  });
}

// Query Data Change events (data_changes) if requested
if (event_types.includes('data_change')) {
  let dataChangeQuery = context.supabase
.from('data_changes')
.select('*')
.eq('user_id', context.user!.id);

  // Apply date filtering
  if (start_date)
dataChangeQuery = dataChangeQuery.gte('created_at', start_date);
  if (end_date)
dataChangeQuery = dataChangeQuery.lte('created_at', end_date);

  const { data: dataChangeData, error: dataChangeError } =
await dataChangeQuery;

  if (dataChangeError) {
return createErrorResponse(
  ErrorCodes.DATABASE_ERROR,
  'Failed to retrieve data change events',
  context.requestId,
  dataChangeError.message,
  context.timestamp,
);
  }

  // Transform data change events
  dataChangeData?.forEach((event) => {
const dataChangeEvent: ActivityEvent = {
  type: 'data_change',
  id: event.id.toString(),
  timestamp: event.created_at,
  user_id: event.user_id || context.user!.id,
  table_name: event.table_name,
  record_id: event.record_id,
  operation: event.operation as 'INSERT' | 'UPDATE' | 'DELETE',
  old_values: event.old_values as Record<string, unknown> | null,
  new_values: event.new_values as Record<string, unknown> | null,
  changed_by: event.changed_by,
  change_reason: event.change_reason,
  ip_address: event.ip_address as string | null,
  user_agent: event.user_agent,
};

allEvents.push({
  timestamp: event.created_at,
  data: dataChangeEvent,
});
  });
}

// Sort all events by timestamp (newest first)
allEvents.sort(
  (a, b) =>
new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
);

// Get unique client IDs and context IDs for lookup (only from OAuth events)
const oauthEvents = allEvents.filter(
  (e) => e.data.type === 'oauth',
) as Array<{
  timestamp: string;
  data: OAuthEvent;
}>;
const clientIds = Array.from(
  new Set(oauthEvents.map((e) => e.data.client_id).filter(Boolean)),
);
const contextIds = Array.from(
  new Set(
oauthEvents
  .map((e) => e.data.context_id)
  .filter((id): id is string => Boolean(id)),
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

// Apply search filtering if provided
let filteredEvents = allEvents;
if (search_query) {
  const query = search_query.toLowerCase();
  filteredEvents = allEvents.filter((event) => {
const eventData = JSON.stringify(event.data).toLowerCase();
return eventData.includes(query);
  });
}

// Apply pagination
const total = filteredEvents.length;
const paginatedEvents = filteredEvents.slice(offset, offset + limit);
const hasMore = offset + limit < total;

// Calculate summary statistics
const summary = {
  total_oauth_events: allEvents.filter((e) => e.data.type === 'oauth')
.length,
  total_auth_events: allEvents.filter((e) => e.data.type === 'auth').length,
  total_data_changes: allEvents.filter((e) => e.data.type === 'data_change')
.length,
  date_range: {
earliest:
  allEvents.length > 0
? allEvents[allEvents.length - 1].timestamp
: null,
latest: allEvents.length > 0 ? allEvents[0].timestamp : null,
  },
};

const response: ActivityTimelineResponse = {
  events: paginatedEvents.map((event) => {
const baseEvent = {
  id: event.data.id,
  timestamp: event.timestamp,
  type: event.data.type,
  data: event.data,
};

// Add client and context data for OAuth events
if (event.data.type === 'oauth') {
  return {
...baseEvent,
clientData: clientData[event.data.client_id] || null,
contextData: event.data.context_id
  ? contextData[event.data.context_id] || null
  : null,
  };
}

return baseEvent;
  }),
  pagination: {
total,
limit,
offset,
hasMore,
  },
  summary,
};

const responseTime = Date.now() - startTime;

// Log performance metrics for monitoring
if (responseTime > 1000) {
  console.warn(
`Slow activity timeline API response: ${responseTime}ms for user ${context.user!.id}`,
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
  'An unexpected error occurred while retrieving activity timeline',
  context.requestId,
  error instanceof Error ? error.message : 'Unknown error',
  context.timestamp,
);
  }
};

export const GET = withRequiredAuth(handleGet);
