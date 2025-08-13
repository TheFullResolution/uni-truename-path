// TrueNamePath: Database Types for Local Use
// Extracted from packages/database for SSR server client compatibility
// Date: August 12, 2025

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
Tables: {
  [_ in never]: never;
};
Views: {
  [_ in never]: never;
};
Functions: {
  graphql: {
Args: {
  extensions?: Json;
  operationName?: string;
  query?: string;
  variables?: Json;
};
Returns: Json;
  };
};
Enums: {
  [_ in never]: never;
};
CompositeTypes: {
  [_ in never]: never;
};
  };
  public: {
Tables: {
  audit_log_entries: {
Row: {
  accessed_at: string;
  action: Database['public']['Enums']['audit_action'];
  context_id: string | null;
  details: Json | null;
  id: number;
  requester_user_id: string | null;
  resolved_name_id: string | null;
  source_ip: unknown | null;
  target_user_id: string;
};
Insert: {
  accessed_at?: string;
  action: Database['public']['Enums']['audit_action'];
  context_id?: string | null;
  details?: Json | null;
  id?: number;
  requester_user_id?: string | null;
  resolved_name_id?: string | null;
  source_ip?: unknown | null;
  target_user_id: string;
};
Update: {
  accessed_at?: string;
  action?: Database['public']['Enums']['audit_action'];
  context_id?: string | null;
  details?: Json | null;
  id?: number;
  requester_user_id?: string | null;
  resolved_name_id?: string | null;
  source_ip?: unknown | null;
  target_user_id?: string;
};
Relationships: [
  {
foreignKeyName: 'audit_log_entries_context_id_fkey';
columns: ['context_id'];
isOneToOne: false;
referencedRelation: 'user_contexts';
referencedColumns: ['id'];
  },
  {
foreignKeyName: 'audit_log_entries_requester_user_id_fkey';
columns: ['requester_user_id'];
isOneToOne: false;
referencedRelation: 'profiles';
referencedColumns: ['id'];
  },
  {
foreignKeyName: 'audit_log_entries_resolved_name_id_fkey';
columns: ['resolved_name_id'];
isOneToOne: false;
referencedRelation: 'names';
referencedColumns: ['id'];
  },
  {
foreignKeyName: 'audit_log_entries_target_user_id_fkey';
columns: ['target_user_id'];
isOneToOne: false;
referencedRelation: 'profiles';
referencedColumns: ['id'];
  },
];
  };
  consents: {
Row: {
  context_id: string;
  created_at: string;
  expires_at: string | null;
  granted_at: string | null;
  granter_user_id: string;
  id: string;
  requester_user_id: string;
  revoked_at: string | null;
  status: Database['public']['Enums']['consent_status'];
  updated_at: string | null;
};
Insert: {
  context_id: string;
  created_at?: string;
  expires_at?: string | null;
  granted_at?: string | null;
  granter_user_id: string;
  id?: string;
  requester_user_id: string;
  revoked_at?: string | null;
  status?: Database['public']['Enums']['consent_status'];
  updated_at?: string | null;
};
Update: {
  context_id?: string;
  created_at?: string;
  expires_at?: string | null;
  granted_at?: string | null;
  granter_user_id?: string;
  id?: string;
  requester_user_id?: string;
  revoked_at?: string | null;
  status?: Database['public']['Enums']['consent_status'];
  updated_at?: string | null;
};
Relationships: [
  {
foreignKeyName: 'consents_context_id_fkey';
columns: ['context_id'];
isOneToOne: false;
referencedRelation: 'user_contexts';
referencedColumns: ['id'];
  },
  {
foreignKeyName: 'consents_granter_user_id_fkey';
columns: ['granter_user_id'];
isOneToOne: false;
referencedRelation: 'profiles';
referencedColumns: ['id'];
  },
  {
foreignKeyName: 'consents_requester_user_id_fkey';
columns: ['requester_user_id'];
isOneToOne: false;
referencedRelation: 'profiles';
referencedColumns: ['id'];
  },
];
  };
  context_name_assignments: {
Row: {
  context_id: string;
  created_at: string;
  id: string;
  name_id: string;
  user_id: string;
};
Insert: {
  context_id: string;
  created_at?: string;
  id?: string;
  name_id: string;
  user_id: string;
};
Update: {
  context_id?: string;
  created_at?: string;
  id?: string;
  name_id?: string;
  user_id?: string;
};
Relationships: [
  {
foreignKeyName: 'context_name_assignments_context_id_fkey';
columns: ['context_id'];
isOneToOne: true;
referencedRelation: 'user_contexts';
referencedColumns: ['id'];
  },
  {
foreignKeyName: 'context_name_assignments_name_id_fkey';
columns: ['name_id'];
isOneToOne: false;
referencedRelation: 'names';
referencedColumns: ['id'];
  },
  {
foreignKeyName: 'context_name_assignments_user_id_fkey';
columns: ['user_id'];
isOneToOne: false;
referencedRelation: 'profiles';
referencedColumns: ['id'];
  },
];
  };
  name_disclosure_log: {
Row: {
  audience: string | null;
  disclosed_at: string;
  id: number;
  name_disclosed: string | null;
  name_id: string | null;
  profile_id: string | null;
  purpose: string | null;
  requested_by: string | null;
};
Insert: {
  audience?: string | null;
  disclosed_at?: string;
  id?: number;
  name_disclosed?: string | null;
  name_id?: string | null;
  profile_id?: string | null;
  purpose?: string | null;
  requested_by?: string | null;
};
Update: {
  audience?: string | null;
  disclosed_at?: string;
  id?: number;
  name_disclosed?: string | null;
  name_id?: string | null;
  profile_id?: string | null;
  purpose?: string | null;
  requested_by?: string | null;
};
Relationships: [];
  };
  names: {
Row: {
  created_at: string;
  id: string;
  is_preferred: boolean;
  name_text: string;
  name_type: Database['public']['Enums']['name_category'];
  source: string | null;
  updated_at: string | null;
  user_id: string | null;
  verified: boolean | null;
};
Insert: {
  created_at?: string;
  id?: string;
  is_preferred?: boolean;
  name_text: string;
  name_type?: Database['public']['Enums']['name_category'];
  source?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  verified?: boolean | null;
};
Update: {
  created_at?: string;
  id?: string;
  is_preferred?: boolean;
  name_text?: string;
  name_type?: Database['public']['Enums']['name_category'];
  source?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
  verified?: boolean | null;
};
Relationships: [
  {
foreignKeyName: 'names_profile_id_fkey';
columns: ['user_id'];
isOneToOne: false;
referencedRelation: 'profiles';
referencedColumns: ['id'];
  },
];
  };
  profiles: {
Row: {
  created_at: string;
  email: string;
  id: string;
  updated_at: string | null;
};
Insert: {
  created_at?: string;
  email: string;
  id?: string;
  updated_at?: string | null;
};
Update: {
  created_at?: string;
  email?: string;
  id?: string;
  updated_at?: string | null;
};
Relationships: [];
  };
  user_contexts: {
Row: {
  context_name: string;
  created_at: string;
  description: string | null;
  id: string;
  updated_at: string | null;
  user_id: string;
};
Insert: {
  context_name: string;
  created_at?: string;
  description?: string | null;
  id?: string;
  updated_at?: string | null;
  user_id: string;
};
Update: {
  context_name?: string;
  created_at?: string;
  description?: string | null;
  id?: string;
  updated_at?: string | null;
  user_id?: string;
};
Relationships: [
  {
foreignKeyName: 'user_contexts_user_id_fkey';
columns: ['user_id'];
isOneToOne: false;
referencedRelation: 'profiles';
referencedColumns: ['id'];
  },
];
  };
};
Views: {
  [_ in never]: never;
};
Functions: {
  current_aud: {
Args: Record<PropertyKey, never>;
Returns: string;
  };
  get_active_consent: {
Args: { p_requester_user_id: string; p_target_user_id: string };
Returns: {
  context_id: string;
  context_name: string;
  consent_id: string;
  granted_at: string;
  expires_at: string;
}[];
  };
  get_context_assignment: {
Args: { p_context_name: string; p_user_id: string };
Returns: {
  name_id: string;
  name_text: string;
  context_id: string;
  context_name: string;
  name_type: Database['public']['Enums']['name_category'];
}[];
  };
  get_preferred_name: {
Args: { p_user_id: string };
Returns: {
  name_id: string;
  name_text: string;
  name_type: Database['public']['Enums']['name_category'];
  is_preferred: boolean;
}[];
  };
  get_user_audit_log: {
Args: { p_limit?: number; p_user_id: string };
Returns: {
  accessed_at: string;
  action: Database['public']['Enums']['audit_action'];
  requester_user_id: string;
  context_name: string;
  resolved_name: string;
  details: Json;
}[];
  };
  get_user_contexts: {
Args: { p_user_id: string };
Returns: {
  context_id: string;
  context_name: string;
  description: string;
  assigned_name: string;
  created_at: string;
}[];
  };
  grant_consent: {
Args: { p_granter_user_id: string; p_requester_user_id: string };
Returns: boolean;
  };
  request_consent: {
Args: {
  p_context_name: string;
  p_expires_at?: string;
  p_granter_user_id: string;
  p_requester_user_id: string;
};
Returns: string;
  };
  resolve_name: {
Args: {
  p_context_name?: string;
  p_requester_user_id?: string;
  p_target_user_id: string;
};
Returns: string;
  };
  revoke_consent: {
Args: { p_granter_user_id: string; p_requester_user_id: string };
Returns: boolean;
  };
};
Enums: {
  audit_action:
| 'NAME_DISCLOSED'
| 'CONSENT_GRANTED'
| 'CONSENT_REVOKED'
| 'CONTEXT_CREATED'
| 'CONSENT_REQUESTED';
  consent_status: 'PENDING' | 'GRANTED' | 'REVOKED' | 'EXPIRED';
  name_category: 'LEGAL' | 'PREFERRED' | 'NICKNAME' | 'ALIAS';
};
CompositeTypes: {
  [_ in never]: never;
};
  };
};

// Re-export commonly used types for convenience
export type Tables<
  PublicTableNameOrOptions extends
| keyof (Database['public']['Tables'] & Database['public']['Views'])
| { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
Database[PublicTableNameOrOptions['schema']]['Views'])
: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
  Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
  Row: infer R;
}
? R
: never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
Database['public']['Views'])
? (Database['public']['Tables'] &
Database['public']['Views'])[PublicTableNameOrOptions] extends {
Row: infer R;
  }
  ? R
  : never
: never;

export type TablesInsert<
  PublicTableNameOrOptions extends
| keyof Database['public']['Tables']
| { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
schema: keyof Database;
  }
? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
  Insert: infer I;
}
? I
: never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
? Database['public']['Tables'][PublicTableNameOrOptions] extends {
Insert: infer I;
  }
  ? I
  : never
: never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
| keyof Database['public']['Tables']
| { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
schema: keyof Database;
  }
? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
  Update: infer U;
}
? U
: never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
? Database['public']['Tables'][PublicTableNameOrOptions] extends {
Update: infer U;
  }
  ? U
  : never
: never;

export type Enums<
  PublicEnumNameOrOptions extends
| keyof Database['public']['Enums']
| { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
: never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
? Database['public']['Enums'][PublicEnumNameOrOptions]
: never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
| keyof Database['public']['CompositeTypes']
| { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
schema: keyof Database;
  }
? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database['public']['CompositeTypes']
? Database['public']['CompositeTypes'][PublicCompositeTypeNameOrOptions]
: never;