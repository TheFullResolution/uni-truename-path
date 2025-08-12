// TrueNamePath: Context-Aware Identity Management API
// TrueNameContextEngine - Core business logic implementation
// Date: August 11, 2025
// Phase 2: TypeScript Business Logic Implementation

import {
  createServerSupabaseClient,
  type SupabaseClient,
} from '@uni-final-project/database';

/**
 * Parameters for name resolution request
 */
export interface ResolveNameParams {
  targetUserId: string;
  requesterUserId?: string;
  contextName?: string;
}

/**
 * Comprehensive name resolution result with full metadata
 */
export interface NameResolution {
  name: string;
  source: ResolutionSource;
  metadata: {
resolutionTimestamp: string;
performanceMs: number;
contextId?: string;
contextName?: string;
nameId?: string;
consentId?: string;
fallbackReason?: string;
requestedContext?: string;
hadRequester?: boolean;
error?: string;
  };
}

/**
 * Resolution source types matching the 3-layer priority system
 */
export type ResolutionSource =
  | 'consent_based'
  | 'context_specific'
  | 'preferred_fallback'
  | 'error_fallback';

/**
 * Helper function return types for type safety
 */
interface ConsentRecord {
  context_id: string;
  context_name: string;
  consent_id: string;
  granted_at: string;
  expires_at: string | null;
}

interface ContextAssignmentRecord {
  name_id: string;
  name_text: string;
  context_id: string;
  context_name: string;
  name_type: string;
}

interface PreferredNameRecord {
  name_id: string;
  name_text: string;
  name_type: string;
  is_preferred: boolean;
}

/**
 * Audit event structure for comprehensive logging
 */
interface AuditEvent {
  targetUserId: string;
  requesterUserId?: string;
  action: string;
  source: ResolutionSource;
  resolvedName: string;
  nameId?: string;
  metadata: Record<string, unknown>;
}

/**
 * TrueNameContextEngine - Core business logic class
 * 
 * Implements the 3-layer priority resolution system:
 * 1. Consent-based resolution (highest priority)
 * 2. Context-specific resolution (medium priority) 
 * 3. Preferred name fallback (lowest priority)
 * 
 * Designed for academic demonstration with comprehensive metadata,
 * audit logging, and performance monitoring capabilities.
 */
export class TrueNameContextEngine {
  private supabase: SupabaseClient;

  /**
   * Constructor with dependency injection for testing
   * @param supabaseClient Optional Supabase client for dependency injection
   */
  constructor(supabaseClient?: SupabaseClient) {
this.supabase = supabaseClient ?? createServerSupabaseClient();
  }

  /**
   * Main resolution method implementing 3-layer priority system
   * 
   * Returns comprehensive metadata for academic evaluation:
   * - Resolution source and timestamp
   * - Context and consent details where applicable
   * - Fallback reasoning for transparency
   * - Performance metrics for benchmarking
   * 
   * @param params Resolution parameters
   * @returns Complete name resolution with metadata
   */
  async resolveName(params: ResolveNameParams): Promise<NameResolution> {
const startTime = this.getPerformanceTime();

try {
  // Priority 1: Consent-based resolution (highest priority)
  if (params.requesterUserId) {
const consentResult = await this.resolveNameWithConsent(params, startTime);
if (consentResult) {
  await this.logAuditEvent({
targetUserId: params.targetUserId,
requesterUserId: params.requesterUserId,
action: 'NAME_DISCLOSED',
source: 'consent_based',
resolvedName: consentResult.name,
nameId: consentResult.metadata.nameId,
metadata: consentResult.metadata,
  });
  
  return consentResult;
}
  }

  // Priority 2: Context-specific resolution (medium priority)
  if (params.contextName && params.contextName.trim() !== '') {
const contextResult = await this.resolveNameWithContext(params, startTime);
if (contextResult) {
  await this.logAuditEvent({
targetUserId: params.targetUserId,
requesterUserId: params.requesterUserId,
action: 'NAME_DISCLOSED',
source: 'context_specific',
resolvedName: contextResult.name,
nameId: contextResult.metadata.nameId,
metadata: contextResult.metadata,
  });
  
  return contextResult;
}
  }

  // Priority 3: Preferred name fallback (lowest priority)
  const fallbackResult = await this.resolveNameWithFallback(params, startTime);
  
  await this.logAuditEvent({
targetUserId: params.targetUserId,
requesterUserId: params.requesterUserId,
action: 'NAME_DISCLOSED',
source: 'preferred_fallback',
resolvedName: fallbackResult.name,
nameId: fallbackResult.metadata.nameId,
metadata: fallbackResult.metadata,
  });
  
  return fallbackResult;

} catch (error) {
  console.error('TrueNameContextEngine: Resolution error:', error);

  const endTime = this.getPerformanceTime();
  const performanceMs = endTime - startTime;

  // Comprehensive error fallback with audit logging
  const errorResult: NameResolution = {
name: 'Anonymous User',
source: 'error_fallback',
metadata: {
  resolutionTimestamp: new Date().toISOString(),
  performanceMs,
  error: error instanceof Error ? error.message : 'Unknown error',
  requestedContext: params.contextName,
  hadRequester: !!params.requesterUserId,
},
  };

  await this.logAuditEvent({
targetUserId: params.targetUserId,
requesterUserId: params.requesterUserId,
action: 'NAME_DISCLOSED',
source: 'error_fallback',
resolvedName: errorResult.name,
nameId: undefined,
metadata: errorResult.metadata,
  });

  return errorResult;
}
  }

  /**
   * Priority 1: Consent-based resolution
   * 
   * Checks for active consent between target and requester users.
   * Uses get_active_consent() helper function from Migration 19.
   * 
   * @param params Resolution parameters
   * @param startTime Performance tracking start time
   * @returns Name resolution or null if no consent found
   */
  private async resolveNameWithConsent(
params: ResolveNameParams,
startTime: number,
  ): Promise<NameResolution | null> {
if (!params.requesterUserId) return null;

try {
  // Call helper function from Migration 19
  const { data: consent, error } = await this.supabase.rpc(
'get_active_consent',
{
  p_target_user_id: params.targetUserId,
  p_requester_user_id: params.requesterUserId,
},
  );

  if (error) {
console.error('Consent resolution error:', error);
return null;
  }

  if (consent && Array.isArray(consent) && consent.length > 0) {
const consentRecord = consent[0] as ConsentRecord;

// Get the associated name for this consent
const nameId = await this.getNameIdFromConsent(
  consentRecord.context_id,
  params.targetUserId
);

if (!nameId) {
  console.warn('No name assignment found for consented context');
  return null;
}

// Fetch the actual name text
const { data: nameData, error: nameError } = await this.supabase
  .from('names')
  .select('name_text')
  .eq('id', nameId)
  .single();

if (nameError) {
  console.error('Name fetch error:', nameError);
  return null;
}

const endTime = this.getPerformanceTime();
const performanceMs = endTime - startTime;

return {
  name: nameData.name_text,
  source: 'consent_based',
  metadata: {
resolutionTimestamp: new Date().toISOString(),
performanceMs,
contextId: consentRecord.context_id,
contextName: consentRecord.context_name,
nameId: nameId,
consentId: consentRecord.consent_id,
requestedContext: params.contextName,
hadRequester: true,
  },
};
  }

  return null;
} catch (error) {
  console.error('Consent resolution exception:', error);
  return null;
}
  }

  /**
   * Priority 2: Context-specific resolution
   * 
   * Looks up direct name assignment for user-defined context.
   * Uses get_context_assignment() helper function from Migration 19.
   * 
   * @param params Resolution parameters
   * @param startTime Performance tracking start time
   * @returns Name resolution or null if no assignment found
   */
  private async resolveNameWithContext(
params: ResolveNameParams,
startTime: number,
  ): Promise<NameResolution | null> {
if (!params.contextName) return null;

try {
  // Call helper function from Migration 19
  const { data: assignment, error } = await this.supabase.rpc(
'get_context_assignment',
{
  p_user_id: params.targetUserId,
  p_context_name: params.contextName,
},
  );

  if (error) {
console.error('Context assignment error:', error);
return null;
  }

  if (assignment && Array.isArray(assignment) && assignment.length > 0) {
const assignmentRecord = assignment[0] as ContextAssignmentRecord;
const endTime = this.getPerformanceTime();
const performanceMs = endTime - startTime;

return {
  name: assignmentRecord.name_text,
  source: 'context_specific',
  metadata: {
resolutionTimestamp: new Date().toISOString(),
performanceMs,
contextId: assignmentRecord.context_id,
contextName: assignmentRecord.context_name,
nameId: assignmentRecord.name_id,
requestedContext: params.contextName,
hadRequester: !!params.requesterUserId,
  },
};
  }

  return null;
} catch (error) {
  console.error('Context resolution exception:', error);
  return null;
}
  }

  /**
   * Priority 3: Preferred name fallback with intelligent reasoning
   * 
   * Uses get_preferred_name() helper function from Migration 19.
   * Provides detailed fallback reasoning for academic transparency.
   * 
   * @param params Resolution parameters
   * @param startTime Performance tracking start time
   * @returns Name resolution (always succeeds with fallback logic)
   */
  private async resolveNameWithFallback(
params: ResolveNameParams,
startTime: number,
  ): Promise<NameResolution> {
try {
  // Call helper function from Migration 19
  const { data: preferredName, error } = await this.supabase.rpc(
'get_preferred_name',
{
  p_user_id: params.targetUserId,
},
  );

  // Generate detailed fallback reasoning for academic evaluation
  let fallbackReason: string;
  if (params.requesterUserId && params.contextName) {
fallbackReason = 'no_consent_and_no_context_assignment';
  } else if (params.requesterUserId) {
fallbackReason = 'no_active_consent';
  } else if (params.contextName) {
fallbackReason = 'context_not_found_or_no_assignment';
  } else {
fallbackReason = 'no_specific_request';
  }

  const endTime = this.getPerformanceTime();
  const performanceMs = endTime - startTime;

  if (error) {
console.error('Preferred name fetch error:', error);
return {
  name: 'Anonymous User',
  source: 'preferred_fallback',
  metadata: {
resolutionTimestamp: new Date().toISOString(),
performanceMs,
fallbackReason: fallbackReason + '_with_database_error',
requestedContext: params.contextName,
hadRequester: !!params.requesterUserId,
error: error.message,
  },
};
  }

  const name =
preferredName && Array.isArray(preferredName) && preferredName.length > 0
  ? (preferredName[0] as PreferredNameRecord).name_text
  : 'Anonymous User';

  const nameId = 
preferredName && Array.isArray(preferredName) && preferredName.length > 0
  ? (preferredName[0] as PreferredNameRecord).name_id
  : undefined;

  return {
name,
source: 'preferred_fallback',
metadata: {
  resolutionTimestamp: new Date().toISOString(),
  performanceMs,
  fallbackReason,
  requestedContext: params.contextName,
  hadRequester: !!params.requesterUserId,
  nameId,
},
  };
} catch (error) {
  console.error('Fallback resolution exception:', error);
  // Re-throw the error so the main catch block can handle it as error_fallback
  throw error;
}
  }

  /**
   * Helper method to get name ID from consent context
   * Handles the join between consents and context_name_assignments
   * 
   * @param contextId Context ID from consent
   * @param userId Target user ID
   * @returns Name ID or null if not found
   */
  private async getNameIdFromConsent(
contextId: string,
userId: string
  ): Promise<string | null> {
try {
  const { data, error } = await this.supabase
.from('context_name_assignments')
.select('name_id')
.eq('context_id', contextId)
.eq('user_id', userId)
.single();

  if (error) {
console.error('Name ID fetch error:', error);
return null;
  }

  return data?.name_id || null;
} catch (error) {
  console.error('Name ID fetch exception:', error);
  return null;
}
  }

  /**
   * Comprehensive audit logging matching SQL function behavior
   * 
   * Maintains GDPR-compliant audit trail with:
   * - Complete resolution metadata
   * - Performance metrics
   * - Error tracking
   * - Context-aware logging
   * 
   * @param event Audit event to log
   */
  private async logAuditEvent(event: AuditEvent): Promise<void> {
try {
  const { error } = await this.supabase.from('audit_log_entries').insert({
target_user_id: event.targetUserId,
requester_user_id: event.requesterUserId || null,
context_id: (event.metadata.contextId as string) || null,
resolved_name_id: event.nameId || null,
action: 'NAME_DISCLOSED' as const,
details: {
  resolution_type: event.source,
  resolved_name: event.resolvedName,
  resolution_timestamp: event.metadata.resolutionTimestamp,
  performance_ms: event.metadata.performanceMs,
  fallback_reason: event.metadata.fallbackReason,
  requested_context: event.metadata.requestedContext,
  had_requester: event.metadata.hadRequester,
  consent_id: event.metadata.consentId,
  error: event.metadata.error,
} as { [key: string]: string | number | boolean | null },
  });

  if (error) {
console.error('Audit logging error:', error);
// Don't throw - audit logging failure shouldn't break resolution
  }
} catch (error) {
  console.error('Audit logging exception:', error);
  // Graceful degradation - continue operation without audit log
}
  }

  /**
   * Simple name resolution for basic use cases
   * Wrapper around main resolveName method for convenience
   * 
   * @param targetUserId Target user ID
   * @param contextName Optional context name
   * @returns Just the resolved name string
   */
  async resolveNameSimple(
targetUserId: string,
contextName?: string
  ): Promise<string> {
const result = await this.resolveName({
  targetUserId,
  contextName,
});
return result.name;
  }

  /**
   * Batch name resolution for multiple users
   * Optimized for multiple resolution requests
   * 
   * @param requests Array of resolution requests
   * @returns Array of name resolutions maintaining order
   */
  async resolveNamesAsync(
requests: ResolveNameParams[]
  ): Promise<NameResolution[]> {
const promises = requests.map(params => this.resolveName(params));
return Promise.all(promises);
  }

  /**
   * Performance benchmarking for academic evaluation
   * 
   * @param params Resolution parameters
   * @param iterations Number of iterations to run
   * @returns Performance statistics
   */
  async benchmark(
params: ResolveNameParams,
iterations: number = 10
  ): Promise<{
iterations: number;
averageMs: number;
minMs: number;
maxMs: number;
totalMs: number;
  }> {
const times: number[] = [];

for (let i = 0; i < iterations; i++) {
  const start = this.getPerformanceTime();
  await this.resolveName(params);
  const end = this.getPerformanceTime();
  times.push(end - start);
}

const totalMs = times.reduce((sum, time) => sum + time, 0);
const averageMs = totalMs / iterations;
const minMs = Math.min(...times);
const maxMs = Math.max(...times);

return {
  iterations,
  averageMs,
  minMs,
  maxMs,
  totalMs,
};
  }

  /**
   * Get performance time using high-resolution timer
   * Falls back to Date.now() if performance API unavailable
   */
  private getPerformanceTime(): number {
return typeof performance !== 'undefined' 
  ? performance.now() 
  : Date.now();
  }

}

/**
 * Factory function for creating TrueNameContextEngine instances
 * Useful for dependency injection and testing scenarios
 * 
 * @param supabaseClient Optional Supabase client
 * @returns New TrueNameContextEngine instance
 */
export function createTrueNameContextEngine(
  supabaseClient?: SupabaseClient
): TrueNameContextEngine {
  return new TrueNameContextEngine(supabaseClient);
}

/**
 * Error types for better error handling
 */
export class TrueNameEngineError extends Error {
  constructor(
message: string,
public readonly code: string,
public readonly metadata?: Record<string, unknown>
  ) {
super(message);
this.name = 'TrueNameEngineError';
  }
}

export class ValidationError extends TrueNameEngineError {
  constructor(message: string, metadata?: Record<string, unknown>) {
super(message, 'VALIDATION_ERROR', metadata);
this.name = 'ValidationError';
  }
}

export class DatabaseError extends TrueNameEngineError {
  constructor(message: string, metadata?: Record<string, unknown>) {
super(message, 'DATABASE_ERROR', metadata);
this.name = 'DatabaseError';
  }
}