import type { UserContext } from '@/types/database';
import type { Database } from '@/generated/database';

// Re-export for convenience
export type { UserContext };

// Core context type with statistics - this is all we need
export interface ContextWithStats extends UserContext {
  name_assignments_count: number;
  has_active_consents: boolean;
  oidc_assignment_count: number;
}

// Simple request types - no optional nonsense
export interface CreateContextRequest {
  context_name: string;
  description: string | null;
  visibility?: Database['public']['Enums']['context_visibility'];
}

export interface UpdateContextRequest {
  context_name: string;
  description: string | null;
  visibility?: Database['public']['Enums']['context_visibility'];
}

// Form data for components - description required for forms
export interface ContextFormData {
  context_name: string;
  description: string;
}

// API response data structures
export interface ContextsResponseData {
  contexts: ContextWithStats[];
}
