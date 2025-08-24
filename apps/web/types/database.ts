// Re-export generated database types and add shortcuts
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from '../generated/database';

import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from '@/generated/database';

// Table type shortcuts
export type Profile = Tables<'profiles'>;
export type Name = Tables<'names'>;
export type UserContext = Tables<'user_contexts'>;
export type OAuthApplication = Tables<'oauth_applications'>;
export type OAuthApplicationInsert = TablesInsert<'oauth_applications'>;
export type OAuthApplicationUpdate = TablesUpdate<'oauth_applications'>;

export type OAuthSession = Tables<'oauth_sessions'>;
export type OAuthSessionInsert = TablesInsert<'oauth_sessions'>;
export type OAuthSessionUpdate = TablesUpdate<'oauth_sessions'>;
export type Assignment = Tables<'context_name_assignments'>;
export type OIDCAssignment = Tables<'context_oidc_assignments'>;
export type Consent = Tables<'consents'>;
export type AuditEntry = Tables<'audit_log_entries'>;

// Insert type shortcuts
export type ProfileInsert = TablesInsert<'profiles'>;
export type NameInsert = TablesInsert<'names'>;
export type UserContextInsert = TablesInsert<'user_contexts'>;
export type AssignmentInsert = TablesInsert<'context_name_assignments'>;
export type OIDCAssignmentInsert = TablesInsert<'context_oidc_assignments'>;
export type ConsentInsert = TablesInsert<'consents'>;

// Update type shortcuts
export type ProfileUpdate = TablesUpdate<'profiles'>;
export type NameUpdate = TablesUpdate<'names'>;
export type UserContextUpdate = TablesUpdate<'user_contexts'>;
export type AssignmentUpdate = TablesUpdate<'context_name_assignments'>;
export type OIDCAssignmentUpdate = TablesUpdate<'context_oidc_assignments'>;
export type ConsentUpdate = TablesUpdate<'consents'>;

// Enum shortcuts
export type ConsentStatus = Enums<'consent_status'>;
export type AuditAction = Enums<'audit_action'>;
export type OIDCProperty = Enums<'oidc_property'>;
export type ContextVisibility = Enums<'context_visibility'>;
