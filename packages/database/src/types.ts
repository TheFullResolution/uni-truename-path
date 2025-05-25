// Generated types from Supabase
// Run: yarn db:types to regenerate from local Supabase instance

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
Tables: {
  profiles: {
Row: {
  id: string
  email: string
  created_at: string
}
Insert: {
  id?: string
  email: string
  created_at?: string
}
Update: {
  id?: string
  email?: string
  created_at?: string
}
Relationships: []
  }
  names: {
Row: {
  id: string
  profile_id: string
  name_text: string
  type: 'legal' | 'preferred' | 'nickname' | 'alias'
  visibility: 'public' | 'internal' | 'restricted' | 'private'
  verified: boolean
  created_at: string
  source: string | null
}
Insert: {
  id?: string
  profile_id: string
  name_text: string
  type: 'legal' | 'preferred' | 'nickname' | 'alias'
  visibility?: 'public' | 'internal' | 'restricted' | 'private'
  verified?: boolean
  created_at?: string
  source?: string | null
}
Update: {
  id?: string
  profile_id?: string
  name_text?: string
  type?: 'legal' | 'preferred' | 'nickname' | 'alias'
  visibility?: 'public' | 'internal' | 'restricted' | 'private'
  verified?: boolean
  created_at?: string
  source?: string | null
}
Relationships: [
  {
foreignKeyName: "names_profile_id_fkey"
columns: ["profile_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  }
]
  }
  consents: {
Row: {
  id: string
  profile_id: string
  audience: string
  purpose: string
  granted_at: string
  granted: boolean
}
Insert: {
  id?: string
  profile_id: string
  audience: string
  purpose: string
  granted_at?: string
  granted?: boolean
}
Update: {
  id?: string
  profile_id?: string
  audience?: string
  purpose?: string
  granted_at?: string
  granted?: boolean
}
Relationships: [
  {
foreignKeyName: "consents_profile_id_fkey"
columns: ["profile_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
  }
]
  }
  name_disclosure_log: {
Row: {
  id: number
  profile_id: string | null
  name_id: string | null
  audience: string | null
  purpose: string | null
  requested_by: string | null
  disclosed_at: string
}
Insert: {
  id?: number
  profile_id?: string | null
  name_id?: string | null
  audience?: string | null
  purpose?: string | null
  requested_by?: string | null
  disclosed_at?: string
}
Update: {
  id?: number
  profile_id?: string | null
  name_id?: string | null
  audience?: string | null
  purpose?: string | null
  requested_by?: string | null
  disclosed_at?: string | null
}
Relationships: []
  }
}
Views: {
  [_ in never]: never
}
Functions: {
  resolve_name: {
Args: {
  p_profile: string
  p_audience: string
  p_purpose: string
}
Returns: string
  }
}
Enums: {
  [_ in never]: never
}
CompositeTypes: {
  [_ in never]: never
}
  }
}

export type Tables<
  PublicTableNameOrOptions extends
| keyof (Database["public"]["Tables"])
| { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
: never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
  Row: infer R
}
? R
: never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
  Row: infer R
}
? R
: never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
| keyof (Database["public"]["Tables"])
| { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
: never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
  Insert: infer I
}
? I
: never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
  Insert: infer I
}
? I
: never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
| keyof (Database["public"]["Tables"])
| { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
: never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
  Update: infer U
}
? U
: never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
  ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
  Update: infer U
}
? U
: never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
| keyof (Database["public"]["Enums"])
| { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
? keyof (Database[PublicEnumNameOrOptions["schema"]]["Enums"])
: never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicEnumNameOrOptions["schema"]]["Enums"])[EnumName]
  : PublicEnumNameOrOptions extends keyof (Database["public"]["Enums"])
  ? (Database["public"]["Enums"])[PublicEnumNameOrOptions]
  : never

// Helper types for common operations
export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Name = Tables<'names'>
export type NameInsert = TablesInsert<'names'>
export type NameUpdate = TablesUpdate<'names'>

export type NameType = Database['public']['Tables']['names']['Row']['type']
export type NameVisibility = Database['public']['Tables']['names']['Row']['visibility']

export type Consent = Tables<'consents'>
export type ConsentInsert = TablesInsert<'consents'>
export type ConsentUpdate = TablesUpdate<'consents'>

export type NameDisclosureLog = Tables<'name_disclosure_log'>

// TrueNamePath context engine types
export type ContextRequest = {
  profileId: string
  audience: string  
  purpose: string
}

export type NameResolutionResult = {
  name: string
  type: NameType
  verified: boolean
  disclosureId: number
}