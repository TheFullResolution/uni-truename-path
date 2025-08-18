import type { Database } from '@/types/database';

// RPC function return types from generated database schema
type GetActiveConsentResult =
  Database['public']['Functions']['get_active_consent']['Returns'];
type GetContextAssignmentResult =
  Database['public']['Functions']['get_context_assignment']['Returns'];
type GetPreferredNameResult =
  Database['public']['Functions']['get_preferred_name']['Returns'];

// Extract individual record types from array returns
export type ConsentRecord = GetActiveConsentResult extends (infer T)[]
  ? T
  : never;
export type ContextAssignmentRecord =
  GetContextAssignmentResult extends (infer T)[] ? T : never;
export type PreferredNameRecord = GetPreferredNameResult extends (infer T)[]
  ? T
  : never;

// Alias for compatibility with existing code
export type ContextAssignmentResult = ContextAssignmentRecord;

// Context engine parameters - consistent snake_case
export interface ResolveNameParams {
  target_user_id: string;
  requester_user_id?: string;
  context_name?: string;
}

// Resolution sources - simplified to what's actually used
export type ResolutionSource =
  | 'consent_based'
  | 'context_specific'
  | 'preferred_fallback'
  | 'error_fallback';

// Clean metadata structure - only essential fields
export interface NameMetadata {
  resolution_timestamp: string;
  response_time_ms: number;
  name_id?: string;
  context_id?: string;
  context_name?: string;
  consent_id?: string;
  fallback_reason?: string;
  requested_context?: string;
  had_requester?: boolean;
  error?: string;
}

// Main resolution result interface - clean and minimal
export interface NameResolution {
  name: string;
  source: ResolutionSource;
  metadata: NameMetadata;
}

// Audit event for logging - clean snake_case
export interface AuditEvent {
  target_user_id: string;
  requester_user_id?: string;
  action: Database['public']['Enums']['audit_action'];
  source: ResolutionSource;
  resolved_name: string;
  name_id?: string;
  metadata: NameMetadata;
}
