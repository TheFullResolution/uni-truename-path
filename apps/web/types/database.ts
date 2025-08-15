/**
 * Web App Database Type Extensions for TrueNamePath
 *
 * This file provides web-specific extensions and utilities for database types.
 * It re-exports generated Supabase types and adds computed fields and UI-specific
 * extensions without duplicating the core type definitions.
 *
 * Key Benefits:
 * - Uses @uni-final-project/database as the single source of truth
 * - Only defines web-specific extensions and computed fields
 * - Eliminates type duplication and drift
 * - Maintains type safety with generated types
 *
 * @fileoverview Web-specific database type extensions
 */

// Re-export all core Supabase generated types as the single source of truth
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from './generated';

// Re-export constants
export { Constants } from './generated';

// Import for type construction and extensions
import type { Enums, Tables } from './generated';

// Re-export base types using generated types (no duplication)
export type Profile = Tables<'profiles'>;
export type Name = Tables<'names'>;
export type Consent = Tables<'consents'>;

// Re-export enum types using generated types (no duplication)
export type NameCategory = Enums<'name_category'>;

/**
 * WEB-SPECIFIC EXTENSIONS
 *
 * The following types extend the base database types with computed fields
 * and UI-specific properties that are not stored in the database.
 */

/**
 * User-Defined Context (Extended)
 *
 * Represents a user-defined context for name resolution with computed fields.
 * Extended beyond the base table structure to include UI-specific metadata.
 */
export interface Context extends Tables<'user_contexts'> {
  /**
   * Number of name variants assigned to this context
   * Computed field for UI display and management
   */
  name_assignments_count: number;

  /**
   * Whether this context has any active consent relationships
   * Computed field indicating if other users have consented to this context
   */
  has_active_consents: boolean;
}
export interface ContextFormData {
  context_name: string;
  description: string;
}

export interface DashboardStats {
  user_profile: {
email: string;
profile_id: string;
member_since: string;
  };
  name_statistics: {
total_names: number;
names_by_type: Record<string, number>;
has_preferred_name: boolean;
  };
  context_statistics: {
custom_contexts: number;
active_consents: number;
pending_consent_requests: number;
  };
  activity_metrics: {
recent_activity_count: number;
api_calls_today: number;
total_api_calls: number;
  };
  privacy_metrics: {
privacy_score: number;
gdpr_compliance_status: 'compliant' | 'needs_attention';
audit_retention_days: number;
  };
}

/**
 * Activity log entry for dashboard display
 */
export interface Activity {
  action: string;
  created_at: string;
  metadata?: {
context_name?: string;
resolved_name?: string;
  };
}

/**
 * CONSTANTS
 *
 * Constants derived from generated enum types
 */

export const NAME_CATEGORIES = [
  'LEGAL',
  'PREFERRED',
  'NICKNAME',
  'ALIAS',
  'PROFESSIONAL',
  'CULTURAL',
] as const;
