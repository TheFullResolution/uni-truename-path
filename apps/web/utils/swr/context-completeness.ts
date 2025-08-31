// TrueNamePath: Context Completeness SWR Hook
// Fetches completeness status for individual contexts using the /api/contexts/[id]/completeness endpoint
// Date: August 31, 2025
// Academic project infrastructure following established SWR patterns

import useSWR from 'swr';
import { swrFetcher } from '@/utils/swr-fetcher';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Response type from the /api/contexts/[id]/completeness endpoint
 */
export interface CompletenessResponse {
  is_complete: boolean;
  context_id: string;
  context_name: string;
  visibility: string;
  required_properties: string[]; // ["name", "given_name", "family_name"]
  assigned_properties: string[];
  missing_properties: string[];
  assignment_count: number;
  completeness_details: {
total_required: number;
total_assigned: number;
total_missing: number;
completion_percentage: number;
  };
  validation_timestamp: string;
}

// =============================================================================
// SWR Hook
// =============================================================================

/**
 * SWR hook for fetching context completeness status
 *
 * @param contextId - The context ID to fetch completeness for, or null to skip fetching
 * @returns Standard SWR response with completeness data
 *
 * @example
 * ```tsx
 * const { data, error, isLoading, mutate } = useContextCompleteness(contextId);
 *
 * if (isLoading) return <Loader />;
 * if (error) return <Alert>Error loading completeness</Alert>;
 * if (data) {
 *   console.log(`Context is ${data.completeness_details.completion_percentage}% complete`);
 * }
 * ```
 */
export function useContextCompleteness(contextId: string | null) {
  return useSWR<CompletenessResponse>(
contextId ? `/api/contexts/${contextId}/completeness` : null,
swrFetcher<CompletenessResponse>,
  );
}
