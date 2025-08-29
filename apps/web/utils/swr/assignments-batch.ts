// TrueNamePath: SWR Batch Assignment API Client

import { createElement } from 'react';
import useSWRMutation from 'swr/mutation';
import { mutate } from 'swr';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

// Import shared utilities and types
import { createMutationFetcher, formatSWRError } from '@/utils/swr-fetcher';
import { CACHE_KEYS } from '@/utils/swr-keys';
import type { BatchOIDCAssignmentRequest } from '@/app/api/assignments/schemas';
import type { BatchOIDCAssignmentResponseData } from '@/app/api/assignments/types';

// =============================================================================
// Type Definitions for SWR Batch Operations
// =============================================================================

/**
 * SWR mutation response type for batch operations
 */
export type BatchOIDCAssignmentResponse = BatchOIDCAssignmentResponseData;

/**
 * Configuration options for batch assignment operations
 */
export interface BatchAssignmentOptions {
  /** Whether to show success notifications */
  showSuccessNotification?: boolean;
  /** Whether to show error notifications */
  showErrorNotification?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Callback executed on successful batch update */
  onSuccess?: (response: BatchOIDCAssignmentResponse) => void;
  /** Callback executed on error */
  onError?: (error: unknown) => void;
}

/**
 * Return type for the batch assignments hook
 */
export interface UseBatchAssignmentsReturn {
  /** Trigger function for batch assignment updates */
  updateAssignmentsBatch: (
data: BatchOIDCAssignmentRequest,
options?: BatchAssignmentOptions,
  ) => Promise<BatchOIDCAssignmentResponse>;
  /** Whether a batch operation is currently in progress */
  isSaving: boolean;
  /** Current error state, if any */
  error: unknown;
  /** Reset error state */
  resetError: () => void;
}

// =============================================================================
// Cache Management Utilities
// =============================================================================

/**
 * Invalidates all assignment-related SWR caches
 * Use after successful batch operations to ensure data consistency
 */
export async function invalidateAssignmentsCache(): Promise<void> {
  // Invalidate all assignment-related cache entries
  await Promise.all([
mutate(
  (key) =>
typeof key === 'string' && key.startsWith(CACHE_KEYS.OIDC_ASSIGNMENTS),
),
mutate(CACHE_KEYS.OIDC_ASSIGNMENTS),
mutate(CACHE_KEYS.STATS), // Dashboard stats may change after assignment updates
  ]);
}

/**
 * Updates assignment cache entries optimistically
 * @param contextId - Context ID to update cache for
 * @param response - Response from batch operation
 */
export async function updateAssignmentsCache(
  contextId: string,
  response: BatchOIDCAssignmentResponse,
): Promise<void> {
  const cacheKey = `${CACHE_KEYS.OIDC_ASSIGNMENTS}?context_id=${contextId}`;

  // Update the specific context assignment cache
  await mutate(
cacheKey,
{
  assignments: response.assignments,
  context_name: response.context_name,
},
{ revalidate: false },
  );

  // Invalidate related caches to ensure consistency
  await mutate(CACHE_KEYS.STATS, undefined, { revalidate: true });
}

// =============================================================================
// Batch Assignment SWR Hook
// =============================================================================

/**
 * SWR hook for batch OIDC assignment operations
 */
export function useBatchAssignments(
  contextId: string,
): UseBatchAssignmentsReturn {
  const { trigger, isMutating, error, reset } = useSWRMutation(
'/api/assignments/oidc/batch',
createMutationFetcher<
  BatchOIDCAssignmentResponse,
  BatchOIDCAssignmentRequest
>('POST'),
  );

  /**
   * Enhanced batch update function with built-in notifications and cache management
   */
  const updateAssignmentsBatch = async (
data: BatchOIDCAssignmentRequest,
options: BatchAssignmentOptions = {},
  ): Promise<BatchOIDCAssignmentResponse> => {
const {
  showSuccessNotification = true,
  showErrorNotification = true,
  successMessage = 'Assignment updates saved successfully',
  errorMessage,
  onSuccess,
  onError,
} = options;

try {
  // Perform the batch update
  const response = await trigger(data);

  // Update cache optimistically
  await updateAssignmentsCache(contextId, response);

  // Show success notification
  if (showSuccessNotification) {
notifications.show({
  title: 'Assignments Updated',
  message: successMessage,
  color: 'green',
  icon: createElement(IconCheck, { size: 16 }),
});
  }

  // Execute success callback
  if (onSuccess) {
onSuccess(response);
  }

  return response;
} catch (error) {
  // Show error notification
  if (showErrorNotification) {
notifications.show({
  title: 'Save Failed',
  message: errorMessage || formatSWRError(error),
  color: 'red',
  icon: createElement(IconX, { size: 16 }),
});
  }

  // Execute error callback
  if (onError) {
onError(error);
  }

  throw error;
}
  };

  return {
updateAssignmentsBatch,
isSaving: isMutating,
error,
resetError: reset,
  };
}

// Re-export utilities that are commonly used with batch operations
export {
  detectAssignmentChanges,
  buildBatchRequest,
  hasActualChanges,
} from '@/utils/assignments';
