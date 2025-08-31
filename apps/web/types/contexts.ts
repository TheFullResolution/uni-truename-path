// Re-export context types from the API
export type { ContextWithStats, UserContext } from '@/app/api/contexts/types';

// Re-export filtering types for convenience
export type { ContextAvailabilityStatus } from '@/utils/contexts/filtering';

// Re-export filtering utilities
export {
  filterAvailableContexts,
  getContextAvailabilityStatus,
  getUnavailableContexts,
} from '@/utils/contexts/filtering';
