/**
 * OAuth Token Validation Helpers
 *
 * Academic implementation for Step 16.2.1 - OAuth Token Validation Middleware
 * Functions kept under 80 lines with simple error handling patterns
 */

import { createClient } from '@/utils/supabase/server';
import type { Database } from '@/generated/database';
import { ErrorCodes } from './types';
import { trackOAuthUsage } from '../analytics';

type OAuthSession = Database['public']['Tables']['oauth_sessions']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type OAuthClientRegistry =
  Database['public']['Tables']['oauth_client_registry']['Row'];

/**
 * Extended OAuth session with related data for context creation
 */
export interface OAuthSessionWithProfile extends OAuthSession {
  profiles: Profile;
  oauth_client_registry: OAuthClientRegistry;
}

/**
 * Result of OAuth token validation
 */
export interface OAuthValidationResult {
  success: boolean;
  session?: OAuthSessionWithProfile;
  error?: string;
}

/**
 * Extract Bearer token from Authorization header
 * Format: "Bearer tnp_[a-f0-9]{32}"
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // Validate token format: tnp_[a-f0-9]{32}
  const tokenRegex = /^tnp_[a-f0-9]{32}$/;
  if (!tokenRegex.test(token)) {
return null;
  }

  return token;
}

/**
 * Validate OAuth token against database and check expiry
 * Academic implementation: <80 lines, simple error handling
 */
export async function validateOAuthToken(
  token: string,
): Promise<OAuthValidationResult> {
  try {
const supabase = await createClient();

// Query oauth_sessions with related profile data
const { data: session, error } = await supabase
  .from('oauth_sessions')
  .select(
`
*,
profiles!inner(id, email, created_at, updated_at)
  `,
  )
  .eq('session_token', token)
  .single();

if (error || !session) {
  return { success: false, error: ErrorCodes.INVALID_TOKEN };
}

// Check if token is expired
const now = new Date();
const expiresAt = new Date(session.expires_at);

if (now > expiresAt) {
  return { success: false, error: ErrorCodes.TOKEN_EXPIRED };
}

// Update used_at timestamp for token usage tracking
await supabase
  .from('oauth_sessions')
  .update({ used_at: now.toISOString() })
  .eq('id', session.id);

// Get client registry info separately
const { data: clientInfo } = await supabase
  .from('oauth_client_registry')
  .select(
'client_id, app_name, display_name, publisher_domain, created_at, last_used_at',
  )
  .eq('client_id', session.client_id)
  .single();

return {
  success: true,
  session: {
...session,
profiles: session.profiles,
oauth_client_registry: clientInfo || {
  client_id: session.client_id,
  app_name: 'Unknown',
  display_name: 'Unknown App',
  publisher_domain: 'unknown',
  created_at: new Date().toISOString(),
  last_used_at: null,
},
  } as OAuthSessionWithProfile,
};
  } catch (error) {
console.error('OAuth token validation error:', error);
return { success: false, error: ErrorCodes.INTERNAL_SERVER_ERROR };
  }
}

/**
 * Log OAuth access for analytics tracking
 * Uses comprehensive analytics system with proper error handling
 */
export async function logOAuthAccess(
  profileId: string,
  clientId: string,
  sessionId: string,
  action: 'resolve' | 'authorize' | 'revoke' = 'resolve',
): Promise<void> {
  const supabase = await createClient();

  await trackOAuthUsage({
supabase,
profileId,
clientId,
action,
sessionId,
success: true,
  });
}

/**
 * Check if Authorization header contains a Bearer token
 * Simple validation for middleware performance
 */
export function hasBearerToken(authHeader: string | null): boolean {
  return !!(authHeader && authHeader.startsWith('Bearer tnp_'));
}

/**
 * Result of OAuth session revocation
 */
export interface OAuthRevocationResult {
  success: boolean;
  sessionId?: string;
  revokedAt?: string;
  assignmentRemoved?: boolean;
  error?: string;
}

/**
 * Revoke an OAuth session token
 * Academic implementation: <30 lines, extracted from revocation endpoint
 */
export async function revokeOAuthSession(
  sessionId: string,
  userId: string,
): Promise<OAuthRevocationResult> {
  try {
const supabase = await createClient();
const timestamp = new Date().toISOString();

// Get session details for validation and logging
const { data: session, error: fetchError } = await supabase
  .from('oauth_sessions')
  .select('id, profile_id, client_id')
  .eq('id', sessionId)
  .eq('profile_id', userId) // Ownership check
  .single();

if (fetchError || !session) {
  return { success: false, error: ErrorCodes.NOT_FOUND };
}

// Delete session (hard delete)
const { error: deleteError } = await supabase
  .from('oauth_sessions')
  .delete()
  .eq('id', sessionId)
  .eq('profile_id', userId);

if (deleteError) {
  return { success: false, error: ErrorCodes.INTERNAL_SERVER_ERROR };
}

// Log revocation action (non-critical)
await logOAuthAccess(
  session.profile_id,
  session.client_id,
  sessionId,
  'revoke',
);

return {
  success: true,
  sessionId,
  revokedAt: timestamp,
  assignmentRemoved: false, // Simplified for helper function
};
  } catch (error) {
console.error('OAuth session revocation error:', error);
return { success: false, error: ErrorCodes.INTERNAL_SERVER_ERROR };
  }
}
