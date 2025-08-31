export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
Tables: {
  [_ in never]: never
}
Views: {
  [_ in never]: never
}
Functions: {
  graphql: {
Args: {
  extensions?: Json
  operationName?: string
  query?: string
  variables?: Json
}
Returns: Json
  }
}
Enums: {
  [_ in never]: never
}
CompositeTypes: {
  [_ in never]: never
}
  }
  public: {
Tables: {
  app_context_assignments: {
Row: {
  client_id: string
  context_id: string
  created_at: string
  id: string
  profile_id: string
  updated_at: string | null
}
Insert: {
  client_id: string
  context_id: string
  created_at?: string
  id?: string
  profile_id: string
  updated_at?: string | null
}
Update: {
  client_id?: string
  context_id?: string
  created_at?: string
  id?: string
  profile_id?: string
  updated_at?: string | null
}
Relationships: [
  {
foreignKeyName: "app_context_assignments_context_id_fkey"
columns: ["context_id"]
isOneToOne: false
referencedRelation: "user_contexts"
referencedColumns: ["id"]
  },
  {
foreignKeyName: "app_context_assignments_profile_id_fkey"
columns: ["profile_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  },
]
  }
  app_usage_log: {
Row: {
  action: string
  client_id: string
  context_id: string | null
  created_at: string
  error_type: string | null
  id: number
  profile_id: string
  resource_id: string | null
  resource_type: string | null
  response_time_ms: number | null
  session_id: string | null
  success: boolean
}
Insert: {
  action: string
  client_id: string
  context_id?: string | null
  created_at?: string
  error_type?: string | null
  id?: number
  profile_id: string
  resource_id?: string | null
  resource_type?: string | null
  response_time_ms?: number | null
  session_id?: string | null
  success?: boolean
}
Update: {
  action?: string
  client_id?: string
  context_id?: string | null
  created_at?: string
  error_type?: string | null
  id?: number
  profile_id?: string
  resource_id?: string | null
  resource_type?: string | null
  response_time_ms?: number | null
  session_id?: string | null
  success?: boolean
}
Relationships: [
  {
foreignKeyName: "app_usage_log_context_id_fkey"
columns: ["context_id"]
isOneToOne: false
referencedRelation: "user_contexts"
referencedColumns: ["id"]
  },
  {
foreignKeyName: "app_usage_log_profile_id_fkey"
columns: ["profile_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  },
]
  }
  context_oidc_assignments: {
Row: {
  context_id: string
  created_at: string
  id: string
  name_id: string
  oidc_property: Database["public"]["Enums"]["oidc_property"]
  updated_at: string | null
  user_id: string
}
Insert: {
  context_id: string
  created_at?: string
  id?: string
  name_id: string
  oidc_property: Database["public"]["Enums"]["oidc_property"]
  updated_at?: string | null
  user_id: string
}
Update: {
  context_id?: string
  created_at?: string
  id?: string
  name_id?: string
  oidc_property?: Database["public"]["Enums"]["oidc_property"]
  updated_at?: string | null
  user_id?: string
}
Relationships: [
  {
foreignKeyName: "context_oidc_assignments_context_id_fkey"
columns: ["context_id"]
isOneToOne: false
referencedRelation: "user_contexts"
referencedColumns: ["id"]
  },
  {
foreignKeyName: "context_oidc_assignments_name_id_fkey"
columns: ["name_id"]
isOneToOne: false
referencedRelation: "names"
referencedColumns: ["id"]
  },
  {
foreignKeyName: "context_oidc_assignments_user_id_fkey"
columns: ["user_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  },
]
  }
  names: {
Row: {
  created_at: string
  id: string
  is_preferred: boolean
  name_text: string
  oidc_properties: Json | null
  source: string | null
  updated_at: string | null
  user_id: string | null
}
Insert: {
  created_at?: string
  id?: string
  is_preferred?: boolean
  name_text: string
  oidc_properties?: Json | null
  source?: string | null
  updated_at?: string | null
  user_id?: string | null
}
Update: {
  created_at?: string
  id?: string
  is_preferred?: boolean
  name_text?: string
  oidc_properties?: Json | null
  source?: string | null
  updated_at?: string | null
  user_id?: string | null
}
Relationships: [
  {
foreignKeyName: "names_profile_id_fkey"
columns: ["user_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  },
]
  }
  oauth_client_registry: {
Row: {
  app_name: string
  client_id: string
  created_at: string
  display_name: string
  last_used_at: string | null
  publisher_domain: string
}
Insert: {
  app_name: string
  client_id: string
  created_at?: string
  display_name: string
  last_used_at?: string | null
  publisher_domain: string
}
Update: {
  app_name?: string
  client_id?: string
  created_at?: string
  display_name?: string
  last_used_at?: string | null
  publisher_domain?: string
}
Relationships: []
  }
  oauth_sessions: {
Row: {
  client_id: string
  created_at: string
  expires_at: string
  id: string
  profile_id: string
  return_url: string
  session_token: string
  state: string | null
  updated_at: string | null
  used_at: string | null
}
Insert: {
  client_id: string
  created_at?: string
  expires_at?: string
  id?: string
  profile_id: string
  return_url: string
  session_token: string
  state?: string | null
  updated_at?: string | null
  used_at?: string | null
}
Update: {
  client_id?: string
  created_at?: string
  expires_at?: string
  id?: string
  profile_id?: string
  return_url?: string
  session_token?: string
  state?: string | null
  updated_at?: string | null
  used_at?: string | null
}
Relationships: [
  {
foreignKeyName: "oauth_sessions_profile_id_fkey"
columns: ["profile_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  },
]
  }
  profiles: {
Row: {
  created_at: string
  email: string
  id: string
  updated_at: string | null
}
Insert: {
  created_at?: string
  email: string
  id?: string
  updated_at?: string | null
}
Update: {
  created_at?: string
  email?: string
  id?: string
  updated_at?: string | null
}
Relationships: []
  }
  user_contexts: {
Row: {
  context_name: string
  created_at: string
  description: string | null
  id: string
  is_permanent: boolean | null
  updated_at: string | null
  user_id: string
}
Insert: {
  context_name: string
  created_at?: string
  description?: string | null
  id?: string
  is_permanent?: boolean | null
  updated_at?: string | null
  user_id: string
}
Update: {
  context_name?: string
  created_at?: string
  description?: string | null
  id?: string
  is_permanent?: boolean | null
  updated_at?: string | null
  user_id?: string
}
Relationships: [
  {
foreignKeyName: "user_contexts_user_id_fkey"
columns: ["user_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  },
]
  }
}
Views: {
  oauth_app_daily_stats: {
Row: {
  app_name: string | null
  authorizations: number | null
  avg_response_time_ms: number | null
  client_id: string | null
  resolutions: number | null
  revocations: number | null
  successful_operations: number | null
  total_operations: number | null
  unique_users: number | null
  usage_date: string | null
}
Relationships: []
  }
  oauth_user_activity_summary: {
Row: {
  avg_response_time_ms: number | null
  connected_apps_count: number | null
  last_activity: string | null
  operations_last_week: number | null
  profile_id: string | null
  successful_operations: number | null
  total_operations: number | null
  user_email: string | null
}
Relationships: [
  {
foreignKeyName: "app_usage_log_profile_id_fkey"
columns: ["profile_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  },
]
  }
}
Functions: {
  assign_default_context_to_app: {
Args: { p_client_id: string; p_profile_id: string }
Returns: string
  }
  auto_populate_context: {
Args: { p_new_context_id: string; p_user_id: string }
Returns: Json
  }
  can_delete_name: {
Args: { p_name_id: string; p_user_id: string }
Returns: Json
  }
  current_aud: {
Args: Record<PropertyKey, never>
Returns: string
  }
  delete_user_account: {
Args: { p_email_confirmation: string; p_user_id: string }
Returns: Json
  }
  generate_oauth_token: {
Args: Record<PropertyKey, never>
Returns: string
  }
  get_oauth_dashboard_stats: {
Args: { p_profile_id: string }
Returns: Json
  }
  get_user_audit_log: {
Args: { p_limit?: number; p_user_id: string }
Returns: {
  accessed_at: string
  action: Database["public"]["Enums"]["audit_action"]
  context_name: string
  details: Json
  requester_user_id: string
  resolved_name: string
}[]
  }
  log_app_usage: {
Args: {
  p_action: string
  p_client_id: string
  p_context_id?: string
  p_error_type?: string
  p_profile_id: string
  p_response_time_ms?: number
  p_session_id?: string
  p_success?: boolean
}
Returns: number
  }
  resolve_oauth_oidc_claims: {
Args: { p_session_token: string }
Returns: Json
  }
  validate_name_deletion_protection_setup: {
Args: Record<PropertyKey, never>
Returns: Json
  }
}
Enums: {
  audit_action:
| "NAME_DISCLOSED"
| "CONSENT_GRANTED"
| "CONSENT_REVOKED"
| "CONTEXT_CREATED"
| "CONSENT_REQUESTED"
  oidc_property:
| "given_name"
| "family_name"
| "name"
| "nickname"
| "display_name"
| "preferred_username"
| "middle_name"
  oidc_property_enum:
| "given_name"
| "family_name"
| "name"
| "nickname"
| "display_name"
| "preferred_username"
| "middle_name"
}
CompositeTypes: {
  [_ in never]: never
}
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
| { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
  }
? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
: never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
  DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
  Row: infer R
}
? R
: never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
DefaultSchema["Views"])
? (DefaultSchema["Tables"] &
DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
Row: infer R
  }
  ? R
  : never
: never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
| keyof DefaultSchema["Tables"]
| { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
  }
? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
: never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
  Insert: infer I
}
? I
: never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
Insert: infer I
  }
  ? I
  : never
: never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
| keyof DefaultSchema["Tables"]
| { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
  }
? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
: never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
  Update: infer U
}
? U
: never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
Update: infer U
  }
  ? U
  : never
: never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
| keyof DefaultSchema["Enums"]
| { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
  }
? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
: never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
| keyof DefaultSchema["CompositeTypes"]
| { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
  }
? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
: never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
: never

export const Constants = {
  graphql_public: {
Enums: {},
  },
  public: {
Enums: {
  audit_action: [
"NAME_DISCLOSED",
"CONSENT_GRANTED",
"CONSENT_REVOKED",
"CONTEXT_CREATED",
"CONSENT_REQUESTED",
  ],
  oidc_property: [
"given_name",
"family_name",
"name",
"nickname",
"display_name",
"preferred_username",
"middle_name",
  ],
  oidc_property_enum: [
"given_name",
"family_name",
"name",
"nickname",
"display_name",
"preferred_username",
"middle_name",
  ],
},
  },
} as const

