import type { Name, NameCategory } from '@/types/database';
import { createClient } from '@/utils/supabase/client';
import type { QueryData } from '@supabase/supabase-js';

// Constants for validation
export const NAME_CATEGORIES: NameCategory[] = [
  'LEGAL',
  'PREFERRED',
  'NICKNAME',
  'ALIAS',
  'PROFESSIONAL',
  'CULTURAL',
];

// Query for names (co-located with API)
export const getNamesQuery = (userId: string) =>
  createClient()
.from('names')
.select('*')
.eq('user_id', userId)
.order('created_at', { ascending: false });

export type NamesQueryResult = QueryData<ReturnType<typeof getNamesQuery>>;

// Request types (snake_case to match existing API patterns)
export interface CreateNameRequest {
  name_text: string;
  name_type: NameCategory;
  is_preferred?: boolean;
  source?: string;
}

export interface UpdateNameRequest {
  name_id?: string;
  name_text?: string;
  name_type?: NameCategory;
  is_preferred?: boolean;
  source?: string;
}

// Response types
export interface NamesResponseData {
  names: Name[];
}

export interface CreateNameResponseData {
  name: Name;
}

export interface UpdateNameResponseData {
  name: Name;
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
