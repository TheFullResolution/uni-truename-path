// TrueNamePath: Batch Request Builder Utilities
// Convert change detection output to API-ready batch requests

import type { AssignmentChange } from './change-detector';
import type { BatchOIDCAssignmentRequest } from '@/app/api/assignments/schemas';

/**
 * Converts change detection output to API-ready batch request format.
 */
export function buildBatchRequest(
  contextId: string,
  changes: AssignmentChange[],
): BatchOIDCAssignmentRequest {
  // Filter out unchanged operations
  const actualChanges = changes.filter(
(change) => change.operation !== 'unchanged',
  );

  // Convert to batch API format
  const assignments = actualChanges.map((change) => ({
oidc_property: change.oidc_property,
name_id: change.new_value,
  }));

  return {
context_id: contextId,
assignments,
  };
}

/**
 * Quick check if batch request has any actual changes to process.
 */
export function hasActualChanges(
  batchRequest: BatchOIDCAssignmentRequest,
): boolean {
  return batchRequest.assignments.length > 0;
}
