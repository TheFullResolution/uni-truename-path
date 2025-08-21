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
export type Assignment = Tables<'context_name_assignments'>;
export type Consent = Tables<'consents'>;
export type AuditEntry = Tables<'audit_log_entries'>;

// Insert type shortcuts
export type ProfileInsert = TablesInsert<'profiles'>;
export type NameInsert = TablesInsert<'names'>;
export type UserContextInsert = TablesInsert<'user_contexts'>;
export type AssignmentInsert = TablesInsert<'context_name_assignments'>;
export type ConsentInsert = TablesInsert<'consents'>;

// Update type shortcuts
export type ProfileUpdate = TablesUpdate<'profiles'>;
export type NameUpdate = TablesUpdate<'names'>;
export type UserContextUpdate = TablesUpdate<'user_contexts'>;
export type AssignmentUpdate = TablesUpdate<'context_name_assignments'>;
export type ConsentUpdate = TablesUpdate<'consents'>;

// Enum shortcuts
export type ConsentStatus = Enums<'consent_status'>;
export type AuditAction = Enums<'audit_action'>;
