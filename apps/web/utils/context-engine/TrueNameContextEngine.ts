import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../supabase/server';
import type {
  AuditEvent,
  ConsentRecord,
  ContextAssignmentResult,
  NameResolution,
  ResolveNameParams,
} from './types';

/**
 * Get Supabase client - simple utility function
 */
async function get_supabase_client(
  provided_client?: SupabaseClient<Database>,
): Promise<SupabaseClient<Database>> {
  return provided_client || (await createClient());
}

/**
 * Priority 1: Consent-based resolution
 * Checks for active consent between target and requester users
 */
async function resolve_name_with_consent(
  supabase: SupabaseClient<Database>,
  params: ResolveNameParams,
  start_time: number,
): Promise<NameResolution | null> {
  if (!params.requester_user_id) return null;

  try {
const { data: consent, error } = await supabase.rpc('get_active_consent', {
  p_target_user_id: params.target_user_id,
  p_requester_user_id: params.requester_user_id,
});

if (error || !consent || !Array.isArray(consent) || consent.length === 0) {
  return null;
}

const consent_record = consent[0] as ConsentRecord;

// Get the associated name for this consent
const { data: assignment_data } = await supabase
  .from('context_name_assignments')
  .select('name_id')
  .eq('context_id', consent_record.context_id)
  .eq('user_id', params.target_user_id)
  .single();

if (!assignment_data?.name_id) return null;

// Fetch the actual name text
const { data: name_data, error: name_error } = await supabase
  .from('names')
  .select('name_text')
  .eq('id', assignment_data.name_id)
  .single();

if (name_error || !name_data) return null;

const response_time_ms = Date.now() - start_time;

return {
  name: name_data.name_text,
  source: 'consent_based',
  metadata: {
resolution_timestamp: new Date().toISOString(),
response_time_ms,
context_id: consent_record.context_id,
context_name: consent_record.context_name,
name_id: assignment_data.name_id,
consent_id: consent_record.consent_id,
requested_context: params.context_name,
had_requester: true,
  },
};
  } catch (error) {
console.error('Consent resolution error:', error);
return null;
  }
}

/**
 * Priority 2: Context-specific resolution
 * Looks up direct name assignment for user-defined context
 */
async function resolve_name_with_context(
  supabase: SupabaseClient<Database>,
  params: ResolveNameParams,
  start_time: number,
): Promise<NameResolution | null> {
  if (!params.context_name) return null;

  try {
const { data: assignment, error } = await supabase.rpc(
  'get_context_assignment',
  {
p_user_id: params.target_user_id,
p_context_name: params.context_name,
  },
);

if (
  error ||
  !assignment ||
  !Array.isArray(assignment) ||
  assignment.length === 0
) {
  return null;
}

const assignment_record = assignment[0] as ContextAssignmentResult;
const response_time_ms = Date.now() - start_time;

return {
  name: assignment_record.name_text,
  source: 'context_specific',
  metadata: {
resolution_timestamp: new Date().toISOString(),
response_time_ms,
context_id: assignment_record.context_id,
context_name: assignment_record.context_name,
name_id: assignment_record.name_id,
requested_context: params.context_name,
had_requester: !!params.requester_user_id,
  },
};
  } catch (error) {
console.error('Context resolution error:', error);
return null;
  }
}

/**
 * Priority 3: Preferred name fallback
 * Uses user's preferred name as final fallback
 */
async function resolve_name_with_fallback(
  supabase: SupabaseClient<Database>,
  params: ResolveNameParams,
  start_time: number,
): Promise<NameResolution> {
  try {
const { data: preferred_name, error } = await supabase.rpc(
  'get_preferred_name',
  {
p_user_id: params.target_user_id,
  },
);

// Generate fallback reason
let fallback_reason: string;
if (params.requester_user_id && params.context_name) {
  fallback_reason = 'no_consent_and_no_context_assignment';
} else if (params.requester_user_id) {
  fallback_reason = 'no_active_consent';
} else if (params.context_name) {
  fallback_reason = 'context_not_found_or_no_assignment';
} else {
  fallback_reason = 'no_specific_request';
}

const response_time_ms = Date.now() - start_time;

if (error) {
  console.error('Preferred name fetch error:', error);
  return {
name: 'Anonymous User',
source: 'preferred_fallback',
metadata: {
  resolution_timestamp: new Date().toISOString(),
  response_time_ms,
  fallback_reason: fallback_reason + '_with_database_error',
  requested_context: params.context_name,
  had_requester: !!params.requester_user_id,
  error: error.message,
},
  };
}

const name =
  preferred_name &&
  Array.isArray(preferred_name) &&
  preferred_name.length > 0
? preferred_name[0].name_text
: 'Anonymous User';

const name_id =
  preferred_name &&
  Array.isArray(preferred_name) &&
  preferred_name.length > 0
? preferred_name[0].name_id
: undefined;

return {
  name,
  source: 'preferred_fallback',
  metadata: {
resolution_timestamp: new Date().toISOString(),
response_time_ms,
fallback_reason,
requested_context: params.context_name,
had_requester: !!params.requester_user_id,
name_id,
  },
};
  } catch (error) {
console.error('Fallback resolution error:', error);
throw error;
  }
}

/**
 * Log audit event for GDPR compliance
 */
async function log_audit_event(
  supabase: SupabaseClient<Database>,
  event: AuditEvent,
): Promise<void> {
  try {
const { error } = await supabase.from('audit_log_entries').insert({
  target_user_id: event.target_user_id,
  requester_user_id: event.requester_user_id || null,
  context_id: event.metadata?.context_id || null,
  resolved_name_id: event.name_id || null,
  action: 'NAME_DISCLOSED' as const,
  details: {
resolution_type: event.source,
resolved_name: event.resolved_name,
resolution_timestamp: event.metadata?.resolution_timestamp,
response_time_ms: event.metadata?.response_time_ms,
fallback_reason: event.metadata?.fallback_reason,
requested_context: event.metadata?.requested_context,
had_requester: event.metadata?.had_requester,
consent_id: event.metadata?.consent_id,
error: event.metadata?.error,
  } as { [key: string]: string | number | boolean | null },
});

if (error) {
  console.error('Audit logging error:', error);
}
  } catch (error) {
console.error('Audit logging exception:', error);
  }
}

/**
 * Main name resolution function implementing 3-layer priority system:
 * 1. Consent-based resolution (highest priority)
 * 2. Context-specific resolution (medium priority)
 * 3. Preferred name fallback (lowest priority)
 */
export async function resolve_name(
  params: ResolveNameParams,
  provided_client?: SupabaseClient<Database>,
): Promise<NameResolution> {
  const start_time = Date.now();
  const supabase = await get_supabase_client(provided_client);

  try {
// Priority 1: Consent-based resolution
if (params.requester_user_id) {
  const consent_result = await resolve_name_with_consent(
supabase,
params,
start_time,
  );
  if (consent_result) {
await log_audit_event(supabase, {
  target_user_id: params.target_user_id,
  requester_user_id: params.requester_user_id,
  action: 'NAME_DISCLOSED',
  source: 'consent_based',
  resolved_name: consent_result.name,
  name_id: consent_result.metadata.name_id,
  metadata: consent_result.metadata,
});
return consent_result;
  }
}

// Priority 2: Context-specific resolution
if (params.context_name && params.context_name.trim() !== '') {
  const context_result = await resolve_name_with_context(
supabase,
params,
start_time,
  );
  if (context_result) {
await log_audit_event(supabase, {
  target_user_id: params.target_user_id,
  requester_user_id: params.requester_user_id,
  action: 'NAME_DISCLOSED',
  source: 'context_specific',
  resolved_name: context_result.name,
  name_id: context_result.metadata.name_id,
  metadata: context_result.metadata,
});
return context_result;
  }
}

// Priority 3: Preferred name fallback
const fallback_result = await resolve_name_with_fallback(
  supabase,
  params,
  start_time,
);

await log_audit_event(supabase, {
  target_user_id: params.target_user_id,
  requester_user_id: params.requester_user_id,
  action: 'NAME_DISCLOSED',
  source: 'preferred_fallback',
  resolved_name: fallback_result.name,
  name_id: fallback_result.metadata.name_id,
  metadata: fallback_result.metadata,
});

return fallback_result;
  } catch (error) {
console.error('Name resolution error:', error);

const response_time_ms = Date.now() - start_time;

const error_result: NameResolution = {
  name: 'Anonymous User',
  source: 'error_fallback',
  metadata: {
resolution_timestamp: new Date().toISOString(),
response_time_ms,
error: error instanceof Error ? error.message : 'Unknown error',
requested_context: params.context_name,
had_requester: !!params.requester_user_id,
  },
};

await log_audit_event(supabase, {
  target_user_id: params.target_user_id,
  requester_user_id: params.requester_user_id,
  action: 'NAME_DISCLOSED',
  source: 'error_fallback',
  resolved_name: error_result.name,
  metadata: error_result.metadata,
});

return error_result;
  }
}

/**
 * Simple name resolution - returns just the name string
 */
export async function resolve_name_simple(
  target_user_id: string,
  context_name?: string,
  provided_client?: SupabaseClient<Database>,
): Promise<string> {
  const result = await resolve_name(
{ target_user_id, context_name },
provided_client,
  );
  return result.name;
}

/**
 * Batch name resolution for multiple requests
 */
export async function resolve_names_batch(
  requests: ResolveNameParams[],
  provided_client?: SupabaseClient<Database>,
): Promise<NameResolution[]> {
  const promises = requests.map((params) =>
resolve_name(params, provided_client),
  );
  return Promise.all(promises);
}

// Legacy class wrapper for backward compatibility
export class TrueNameContextEngine {
  constructor(private provided_client?: SupabaseClient<Database>) {}

  async resolveName(params: ResolveNameParams): Promise<NameResolution> {
// All params should now be snake_case, just pass through
return resolve_name(params, this.provided_client);
  }

  async resolveNameSimple(
target_user_id: string,
context_name?: string,
  ): Promise<string> {
return resolve_name_simple(
  target_user_id,
  context_name,
  this.provided_client,
);
  }

  async resolveNamesAsync(
requests: ResolveNameParams[],
  ): Promise<NameResolution[]> {
return resolve_names_batch(requests, this.provided_client);
  }
}
