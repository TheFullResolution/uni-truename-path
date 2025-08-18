import type { UserContext } from '@/types/database';

// Re-export for convenience
export type { UserContext };

// Core context type with statistics - this is all we need
export interface ContextWithStats extends UserContext {
  name_assignments_count: number;
  has_active_consents: boolean;
}

// Simple request types - no optional nonsense
export interface CreateContextRequest {
  context_name: string;
  description: string | null;
}

export interface UpdateContextRequest {
  context_name: string;
  description: string | null;
}

// Form data for components - description required for forms
export interface ContextFormData {
  context_name: string;
  description: string;
}
