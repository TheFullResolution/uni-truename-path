import type { Tables } from '@/generated/database';
import { createClient } from '@/utils/supabase/client';
import type { QueryData } from '@supabase/supabase-js';

// Query for names (co-located with API)
export const getNamesQuery = (userId: string) =>
  createClient()
.from('names')
.select('*')
.eq('user_id', userId)
.order('created_at', { ascending: false });

export type NamesQueryResult = QueryData<ReturnType<typeof getNamesQuery>>;

// Request types (simplified, snake_case to match existing API patterns)
export interface CreateNameRequest {
  name_text: string;
  is_preferred?: boolean;
  source?: string;
  oidc_properties?: {
description?: string;
pronunciation_guide?: string;
locale?: string;
// Allow additional properties for form flexibility
[key: string]: unknown;
  };
}

export interface UpdateNameRequest {
  name_id?: string;
  name_text?: string;
  is_preferred?: boolean;
  oidc_properties?: {
description?: string;
pronunciation_guide?: string;
locale?: string;
  };
}

// Response types
export interface NamesResponseData {
  names: Tables<'names'>[];
  total: number;
  metadata: {
retrieval_timestamp: string;
filter_applied?: {
  limit?: number;
};
userId: string;
  };
}

export interface CreateNameResponseData {
  name: Tables<'names'>;
}

export interface UpdateNameResponseData {
  name: Tables<'names'>;
}

export interface DeleteNameResponseData {
  deleted_name_id: string;
}

// Name resolution types
export interface ResolveNameRequest {
  target_user_id: string;
  context_name?: string;
  requester_user_id?: string;
}

export interface ResolveNameResponseData {
  resolved_name: string;
  source: string;
  metadata?: {
context_id?: string;
context_name?: string;
consent_id?: string;
processing_time_ms?: number;
  };
}

// Batch resolution request item
export interface BatchResolutionRequestItem {
  target_user_id: string;
  context_name?: string;
}

// Batch resolution response item
export interface BatchResolutionItem {
  context: string;
  resolved_name: string;
  source: ResolutionSource;
  response_time_ms: number;
  error?: string;
}

export interface BatchResolutionRequest {
  resolutions: BatchResolutionRequestItem[];
}

export interface BatchResolutionResponseData {
  results: Array<{
target_user_id: string;
resolved_name: string;
source: string;
context_name?: string;
  }>;
}

// Actual batch resolution data (what the API returns)
export interface BatchResolutionData {
  user_id: string;
  resolutions: BatchResolutionItem[];
  total_contexts: number;
  successful_resolutions: number;
  batch_time_ms: number;
  timestamp: string;
}

// Resolution source type (matching NameResolution)
export type ResolutionSource =
  | 'consent'
  | 'context_specific'
  | 'preferred_fallback'
  | 'fallback'
  | 'error'
  | 'error_fallback'
  | 'consent_based';

// Resolve name data type
export interface ResolveNameData {
  resolved_name: string;
  source: ResolutionSource;
  metadata?: {
context_id?: string;
context_name?: string;
consent_id?: string;
processing_time_ms?: number;
  };
}
