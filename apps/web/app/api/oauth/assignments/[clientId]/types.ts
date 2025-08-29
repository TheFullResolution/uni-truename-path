// TrueNamePath: OAuth Assignment Update Endpoint Response Type Definitions
// Response types for PUT /api/oauth/assignments/[clientId] endpoint
// Date: August 28, 2025
// Academic project - OAuth context assignment updates

// Type definitions for OAuth assignment update endpoints

// =============================================================================
// Core Response Data Types
// =============================================================================

/**
 * OAuth Assignment Update Response Data Structure
 * Main response payload for successful assignment update requests
 * Confirms the updated assignment details
 */
export interface UpdateAssignmentResponseData {
  /** Updated assignment unique identifier */
  assignment_id: string;
  /** OAuth client identifier */
  client_id: string;
  /** Updated context unique identifier */
  context_id: string;
  /** User-defined context name */
  context_name: string;
  /** Assignment update timestamp in ISO 8601 format */
  updated_at: string;
  /** Assignment status after update */
  status: 'active' | 'inactive';
}

// =============================================================================
// Database Integration Types
// =============================================================================

/**
 * Assignment update data for database operations
 * Internal structure for database update operations
 */
export interface AssignmentUpdateData {
  /** Assignment ID to update */
  assignment_id: string;
  /** New context ID */
  context_id: string;
  /** Update timestamp */
  updated_at: string;
  /** User ID for validation */
  user_id: string;
}

/**
 * Assignment validation context
 * Validation state for assignment update requests
 */
export interface AssignmentUpdateValidation {
  /** Whether the client exists and is active */
  client_valid: boolean;
  /** Whether the context exists and is accessible */
  context_valid: boolean;
  /** Whether the assignment exists and can be updated */
  assignment_valid: boolean;
  /** Any validation errors encountered */
  errors: Array<{
field: string;
code: AssignmentUpdateErrorCode;
message: string;
  }>;
}

/**
 * Client assignment information for update response
 * Current assignment details with updated context information
 */
export interface AssignmentClientInfo {
  /** OAuth client identifier */
  client_id: string;
  /** Human-readable display name */
  display_name: string;
  /** Publisher domain for the client */
  publisher_domain: string;
  /** Assignment status */
  assignment_status: 'active' | 'inactive';
}

/**
 * Context information for assignment update response
 * Updated context data with required fields for external consumption
 */
export interface AssignmentContextInfo {
  /** Context unique identifier */
  id: string;
  /** User-defined context name */
  context_name: string;
  /** Context owner (for validation) */
  user_id: string;
}

// =============================================================================
// Service Integration Types
// =============================================================================

/**
 * Assignment update service input parameters
 * Internal service contract for assignment update processing
 */
export interface AssignmentUpdateParams {
  /** Authenticated user ID */
  user_id: string;
  /** Target client ID */
  client_id: string;
  /** New context ID */
  context_id: string;
  /** Request timestamp for audit logging */
  timestamp: string;
}

/**
 * Assignment update service result
 * Complete result object from assignment update service
 */
export interface AssignmentUpdateResult {
  /** Updated assignment data */
  assignment: AssignmentUpdateData;
  /** Client information from registry */
  client: AssignmentClientInfo;
  /** Updated context information */
  context: AssignmentContextInfo;
}

// =============================================================================
// Error and Validation Types
// =============================================================================

/**
 * Assignment update error codes specific to the assignment endpoint
 * Extends the base OAuth error codes with assignment-specific errors
 */
export const AssignmentUpdateErrorCodes = {
  /** Client not found in registry */
  CLIENT_NOT_FOUND: 'OAUTH_CLIENT_NOT_FOUND',
  /** Client is not active */
  CLIENT_INACTIVE: 'OAUTH_CLIENT_INACTIVE',
  /** Context not found or not accessible */
  CONTEXT_NOT_FOUND: 'CONTEXT_NOT_FOUND',
  /** Context does not belong to the user */
  CONTEXT_ACCESS_DENIED: 'CONTEXT_ACCESS_DENIED',
  /** Assignment not found for client */
  ASSIGNMENT_NOT_FOUND: 'ASSIGNMENT_NOT_FOUND',
  /** Assignment does not belong to the user */
  ASSIGNMENT_ACCESS_DENIED: 'ASSIGNMENT_ACCESS_DENIED',
  /** Assignment update failed */
  ASSIGNMENT_UPDATE_FAILED: 'ASSIGNMENT_UPDATE_FAILED',
  /** Validation error for request parameters */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type AssignmentUpdateErrorCode =
  (typeof AssignmentUpdateErrorCodes)[keyof typeof AssignmentUpdateErrorCodes];

// =============================================================================
// Response Builder Types
// =============================================================================

/**
 * Response builder configuration
 * Configuration for building standardized assignment update responses
 */
export interface AssignmentUpdateResponseConfig {
  /** Request ID for tracking */
  request_id: string;
  /** Response timestamp */
  timestamp: string;
  /** User ID for audit logging */
  user_id: string;
  /** Success/error response builders */
  response_builders: {
success: (data: UpdateAssignmentResponseData) => unknown;
error: (code: string, message: string, data?: unknown) => unknown;
  };
}
