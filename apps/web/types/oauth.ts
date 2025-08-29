import type { ApiResponse } from './api';

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

// API response type for connected apps endpoint
export type ConnectedAppsResponse = ApiResponse<ConnectedAppsData>;

// OAuth session token validation result
export interface OAuthTokenValidation {
  valid: boolean;
  session_id?: string;
  profile_id?: string;
  client_id?: string;
  expires_at?: string;
  error?: string;
}

// OAuth authorization request parameters
export interface OAuthAuthorizationParams {
  client_id: string;
  redirect_uri: string;
  state?: string;
  context_id?: string;
}

// OAuth authorization response
export interface OAuthAuthorizationData {
  session_token: string;
  expires_at: string;
  redirect_url: string;
}

export type OAuthAuthorizationResponse = ApiResponse<OAuthAuthorizationData>;

// OAuth context assignment for applications
export interface AppContextAssignment {
  client_id: string;
  context_id: string;
  assigned_at: string;
}

// OAuth application registration data
export interface OAuthAppRegistrationData {
  client_id: string;
  display_name: string;
  publisher_domain: string;
  app_name: string;
  redirect_uri: string;
  created_at: string;
}

export type OAuthAppRegistrationResponse =
  ApiResponse<OAuthAppRegistrationData>;

// OAuth dashboard statistics
export interface OAuthDashboardStats {
  total_connected_apps: number;
  active_sessions_count: number;
  total_authorizations: number;
  last_activity?: string;
}

export type OAuthDashboardStatsResponse = ApiResponse<OAuthDashboardStats>;

// OAuth assignment update request/response types
export interface UpdateAssignmentRequest {
  context_id: string;
}

export interface UpdateAssignmentResponseData {
  assignment_id: string;
  client_id: string;
  context_id: string;
  context_name: string;
  updated_at: string;
  status: 'active' | 'inactive';
}

export type UpdateAssignmentResponse =
  ApiResponse<UpdateAssignmentResponseData>;

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
