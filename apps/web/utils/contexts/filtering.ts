import type { ContextWithStats } from '@/app/api/contexts/types';

/**
 * Availability status for contexts in OAuth/Connected Apps scenarios
 * SIMPLIFIED: No visibility logic - only completeness validation
 */
export interface ContextAvailabilityStatus {
  available: boolean;
  reason?: 'invalid'; // Changed from 'incomplete' to 'invalid'
  missingProperties?: string[];
}

/**
 * Determines the availability status of a context for OAuth/Connected Apps usage
 *
 * SIMPLIFIED LOGIC:
 * - Public context (is_permanent=true): Always available regardless of completeness
 * - Invalid contexts: Excluded (missing required properties)
 * - Partial/Complete contexts: Available
 *
 * @param context - The context to check
 * @returns Availability status with reason if unavailable
 */
export function getContextAvailabilityStatus(
  context: ContextWithStats,
): ContextAvailabilityStatus {
  // Public context (permanent) is always available
  if (context.is_permanent) {
return {
  available: true,
};
  }

  // Exclude invalid contexts (missing required properties)
  // Allow partial and complete contexts
  if (context.completion_status === 'invalid') {
return {
  available: false,
  reason: 'invalid',
  missingProperties: context.missing_properties,
};
  }

  return {
available: true,
  };
}

/**
 * Filters contexts to only include those available for OAuth/Connected Apps usage
 *
 * SIMPLIFIED FILTERING:
 * - Public context (is_permanent=true): Always included
 * - Invalid contexts: Excluded (missing required properties)
 * - Partial contexts: Included (has required but not all optional)
 * - Complete contexts: Included (has all properties)
 *
 * @param contexts - Array of contexts to filter
 * @returns Filtered array of available contexts
 */
export function filterAvailableContexts(
  contexts: ContextWithStats[],
): ContextWithStats[] {
  return contexts.filter((context) => {
const status = getContextAvailabilityStatus(context);
return status.available;
  });
}

/**
 * Gets unavailable contexts with their reasons (useful for UI feedback)
 *
 * @param contexts - Array of contexts to check
 * @returns Array of contexts with their unavailability reasons
 */
export function getUnavailableContexts(
  contexts: ContextWithStats[],
): Array<{ context: ContextWithStats; status: ContextAvailabilityStatus }> {
  return contexts
.map((context) => ({
  context,
  status: getContextAvailabilityStatus(context),
}))
.filter(({ status }) => !status.available);
}
