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

// Enhanced query for names with assignments (for optimized frontend usage)
export const getNamesWithAssignmentsQuery = (userId: string) =>
  createClient()
.from('names')
.select(
  `
  *,
  context_oidc_assignments!left (
context_id,
oidc_property,
user_contexts!inner (
  id,
  context_name,
  is_permanent
)
  )
`,
)
.eq('user_id', userId)
.order('is_preferred', { ascending: false })
.order('created_at', { ascending: false });

export type NamesQueryResult = QueryData<ReturnType<typeof getNamesQuery>>;
export type NamesWithAssignmentsQueryResult = QueryData<
  ReturnType<typeof getNamesWithAssignmentsQuery>
>;

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

// Assignment data for enhanced names response
export interface NameAssignment {
  context_id: string;
  context_name: string;
  is_permanent: boolean;
  oidc_property: string;
}

// Enhanced name object with optional assignments
export interface NameWithAssignments extends Tables<'names'> {
  assignments?: NameAssignment[];
}

// Response types
export interface NamesResponseData {
  names: NameWithAssignments[];
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
