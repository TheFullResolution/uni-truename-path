import type { QueryData } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

// Query for assignments with details (raw database query)
export const getAssignmentsWithDetailsQuery = (userId: string) =>
  createClient()
.from('context_name_assignments')
.select(
  `
  id,
  context_id,
  name_id,
  created_at,
  user_contexts!inner(
id,
context_name,
description
  ),
  names!inner(
id,
name_text,
name_type
  )
`,
)
.eq('user_id', userId)
.order('created_at', { ascending: false });

// Raw database result type (exported since it might be used)
export type RawAssignmentQueryResult = QueryData<
  ReturnType<typeof getAssignmentsWithDetailsQuery>
>;

// Transformed assignment details (what the API actually returns)
export interface AssignmentWithDetails {
  id: string;
  context_id: string;
  context_name: string;
  context_description: string | null;
  name_id: string;
  name_text: string;
  name_type: string;
  created_at: string;
}

// Response data types for API endpoints
export interface AssignmentsResponseData {
  assignments: AssignmentWithDetails[];
  unassigned_contexts: UnassignedContext[];
  total_contexts: number;
  assigned_contexts: number;
  metadata: {
retrieval_timestamp: string;
filter_applied: {
  context_id?: string;
  limit?: number;
};
user_id: string;
  };
}

export interface UnassignedContext {
  id: string;
  context_name: string;
  description: string | null;
}

export interface CreateAssignmentResponseData {
  message: string;
  assignment: AssignmentWithDetails;
}

export interface UpdateAssignmentResponseData {
  message: string;
  assignment: AssignmentWithDetails;
}

export interface DeleteAssignmentResponseData {
  message: string;
  deleted_assignment_id: string;
  context_id: string;
  context_name: string;
  deleted_at: string;
}

export interface BulkAssignmentResponseData {
  updated: number;
  created: number;
  deleted: number;
  assignments: AssignmentWithDetails[];
}
