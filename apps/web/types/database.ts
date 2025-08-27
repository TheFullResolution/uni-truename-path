// Re-export generated database types and add shortcuts
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from '../generated/database';

import type { Enums, Tables } from '@/generated/database';

// Table type shortcuts
export type Profile = Tables<'profiles'>;
export type Name = Tables<'names'>;
export type UserContext = Tables<'user_contexts'>;

export type Assignment = Tables<'context_name_assignments'>;
export type Consent = Tables<'consents'>;

export type OIDCProperty = Enums<'oidc_property'>;
