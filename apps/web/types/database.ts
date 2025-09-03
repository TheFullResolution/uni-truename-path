// Re-export generated database types and add shortcuts
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from '../generated/database';

import type { Enums, Tables } from '@/generated/database';

// Table type shortcuts
export type Profile = Tables<'profiles'>;
export type Name = Tables<'names'>;
export type UserContext = Tables<'user_contexts'>;

export type OIDCProperty = Enums<'oidc_property'>;

// Activity System Types - Comprehensive audit logging

// Base event interface
interface BaseActivityEvent {
  id: string;
  timestamp: string;
  user_id: string;
}

// OAuth Events (from app_usage_log)
export interface OAuthEvent extends BaseActivityEvent {
  type: 'oauth';
  action: string; // authorize, resolve, revoke, assign_context
  client_id: string;
  session_id: string | null;
  context_id: string | null;
  success: boolean;
  error_type: string | null;
  response_time_ms: number | null;
  profile_id: string; // Foreign key to profiles
}

// Authentication Events (from auth_events)
export interface AuthEvent extends BaseActivityEvent {
  type: 'auth';
  event_type: string; // login, logout, signup, failed_login, session_expired
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  session_id: string | null;
  metadata: Record<string, unknown>;
}

// Data Change Events (from data_changes)
export interface DataChangeEvent extends BaseActivityEvent {
  type: 'data_change';
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_by: string | null; // User ID who made the change
  change_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

// Union type for all activity events
export type ActivityEvent = OAuthEvent | AuthEvent | DataChangeEvent;

// Activity timeline response
export interface ActivityTimelineResponse {
  events: Array<{
id: string;
timestamp: string;
type: ActivityEvent['type'];
data: ActivityEvent;
clientData?: {
  display_name: string;
  publisher_domain: string;
} | null;
contextData?: {
  name: string;
} | null;
  }>;
  pagination: {
total: number;
limit: number;
offset: number;
hasMore: boolean;
  };
  summary: {
total_oauth_events: number;
total_auth_events: number;
total_data_changes: number;
date_range: {
  earliest: string | null;
  latest: string | null;
};
  };
}

// Filter options for activity timeline
export interface ActivityFilters {
  event_types: Array<ActivityEvent['type']>;
  start_date: string | null;
  end_date: string | null;
  success_only: boolean | null;
  search_query: string | null;
}

// Enhanced can_delete_name RPC function response interface
export interface CanDeleteNameResponse {
  can_delete: boolean;
  reason: string;
  reason_code: string;
  protection_type: string;
  name_count: number;
  context_info: {
public_contexts: Array<{
  id: string;
  context_name: string;
}>;
permanent_contexts: Array<{
  id: string;
  context_name: string;
}>;
  };
}

// Name assignments response interface (visibility removed - simplified model)
export interface NameAssignmentsResponse {
  assignments: Array<{
context_id: string;
context_name: string;
// visibility removed - contexts are now validated by completeness only
is_permanent: boolean;
oidc_property: string;
  }>;
  total: number;
}
