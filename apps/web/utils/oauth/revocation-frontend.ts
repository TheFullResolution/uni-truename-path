/**
 * OAuth Frontend Revocation Utilities
 * University Final Project - TrueNamePath
 *
 * @description Frontend utilities for OAuth app revocation using API endpoints
 * @academic_constraint Functions ≤30 lines each
 * @performance <3ms target for all operations
 */

export interface RevocationResult {
  success: boolean;
  message: string;
  revokedSessions?: number;
  partialFailure?: boolean;
}

/**
 * Frontend app revocation function using API endpoint
 * Calls POST /api/oauth/revoke to revoke all sessions for a client_id
 * @academic_constraint ≤30 lines
 */
export async function revokeConnectedApp(
  clientId: string,
  profileId: string, // Kept for compatibility but not needed (API uses session)
  removeAssignment: boolean = true,
): Promise<RevocationResult> {
  try {
const response = await fetch('/api/oauth/revoke', {
  method: 'POST',
  headers: {
'Content-Type': 'application/json',
  },
  body: JSON.stringify({
client_id: clientId,
remove_assignment: removeAssignment,
  }),
});

const result = await response.json();

if (!response.ok) {
  return {
success: false,
message: result.error?.message || 'Failed to revoke app access',
  };
}

const { revoked_sessions } = result.data;
return {
  success: true,
  message:
revoked_sessions === 0
  ? 'Application access was already inactive'
  : `Successfully revoked access for all ${revoked_sessions} active session${revoked_sessions !== 1 ? 's' : ''}`,
  revokedSessions: revoked_sessions,
};
  } catch (error) {
console.error('Frontend revocation error:', error);
return {
  success: false,
  message: 'Failed to revoke application access. Please try again.',
};
  }
}
