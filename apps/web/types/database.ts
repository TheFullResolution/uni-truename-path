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

// OAuth table shortcuts
export type OAuthApplication = Tables<'oauth_applications'>;
export type OAuthClientRegistry = Tables<'oauth_client_registry'>;
export type OAuthSession = Tables<'oauth_sessions'>;

export type OIDCProperty = Enums<'oidc_property'>;
