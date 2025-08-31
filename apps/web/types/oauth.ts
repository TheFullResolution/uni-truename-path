// Connected App interface for the dashboard
export interface ConnectedApp {
  client_id: string; // tnp_[16 hex chars]
  display_name: string; // "HR App"
  publisher_domain: string; // "demo-hr.vercel.app"
  context_id: string; // User's context UUID
  context_name: string; // "Professional Work"
  last_used_at: string | null; // ISO timestamp
  active_sessions: number; // Count of active sessions
  total_usage_count: number; // From app_usage_log
}

// Connected apps response data structure (simplified for academic project)
export interface ConnectedAppsData {
  connected_apps: ConnectedApp[];
}
export interface UpdateAssignmentResponseData {
  assignment_id: string;
  client_id: string;
  context_id: string;
  context_name: string;
  updated_at: string;
  status: 'active' | 'inactive';
}

// Service layer types for assignment updates
export interface AssignmentUpdateData {
  id: string;
  profile_id: string;
  client_id: string;
  context_id: string;
}

export interface AssignmentUpdateServiceResult {
  data: AssignmentUpdateData | null;
  error: Error | null;
}

// OAuth revocation request/response types
export interface RevokeAppRequest {
  client_id: string;
  remove_assignment: boolean;
}

export interface RevokeAppResponseData {
  revoked: boolean;
  client_id: string;
  revoked_sessions: number;
  assignment_removed: boolean;
  revoked_at: string;
}
