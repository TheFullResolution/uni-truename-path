import type { UserContext } from '@/types/database';

// Re-export for convenience
export type { UserContext };

// Core context type with statistics - this is all we need
export interface ContextWithStats extends UserContext {
  name_assignments_count: number;
  has_active_consents: boolean;
  oidc_assignment_count: number;
}
