import type { UserContext } from '@/types/database';

// Re-export for convenience
export type { UserContext };

// Core context type with statistics - this is all we need
export interface ContextWithStats extends UserContext {
  name_assignments_count: number;
  has_active_consents: boolean;
  oidc_assignment_count: number;

  // Completeness data for better performance and UX
  is_complete: boolean;
  missing_properties: string[];
  completion_percentage: number;
}
