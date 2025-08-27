// TrueNamePath: OAuth Authorization Helper Functions
// Modular helper functions for POST /api/oauth/authorize endpoint
// Date: August 23, 2025
// Academic project - Supporting OAuth authorization flow with testable components

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/generated/database';
import { AuthorizeContextInfo, AuthorizeClientInfo } from './types';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Result type for OAuth session creation
 * Contains all data needed for authorization response
 */
export interface SessionCreationResult {
  /** Generated session token in tnp_[32 hex] format */
  session_token: string;
  /** Token expiration timestamp (ISO 8601) */
  expires_at: string;
  /** Session creation success flag */
  success: boolean;
}

/**
 * Database client type for helper functions
 * Ensures type safety with generated database schema
 */
type DatabaseClient = SupabaseClient<Database>;

// =============================================================================
// Application Validation Helper
// =============================================================================

/**
 * Validates OAuth client access via client registry
 *
 * @param clientId - OAuth client ID in format tnp_[16 hex chars]
 * @param supabase - Authenticated Supabase client
 * @returns Promise<AuthorizeClientInfo | null> - Client data or null if invalid
 */
export async function validateAppAccess(
  clientId: string,
  supabase: DatabaseClient,
): Promise<AuthorizeClientInfo | null> {
  try {
// Query oauth_client_registry table with required fields
const { data: client, error: clientError } = await supabase
  .from('oauth_client_registry')
  .select('client_id, app_name, display_name, publisher_domain')
  .eq('client_id', clientId)
  .single();

// Handle database errors or missing client
if (clientError || !client) {
  return null;
}

// Return typed client information
return {
  client_id: client.client_id,
  display_name: client.display_name,
  app_name: client.app_name,
  publisher_domain: client.publisher_domain,
};
  } catch (error) {
// Log validation error for debugging
console.error('Client validation failed:', error);
return null;
  }
}

// =============================================================================
// Context Ownership Validation Helper
// =============================================================================

/**
 * Validates user context ownership and accessibility
 *
 * @param contextId - User context UUID to validate
 * @param userId - User ID to check ownership against
 * @param supabase - Authenticated Supabase client
 * @returns Promise<AuthorizeContextInfo | null> - Context data or null if invalid
 */
export async function validateContextOwnership(
  contextId: string,
  userId: string,
  supabase: DatabaseClient,
): Promise<AuthorizeContextInfo | null> {
  try {
// Query user_contexts table with ownership check
const { data: context, error: contextError } = await supabase
  .from('user_contexts')
  .select('id, context_name, user_id')
  .eq('id', contextId)
  .eq('user_id', userId)
  .single();

// Handle database errors or access denied
if (contextError || !context) {
  return null;
}

// Return typed context information
return {
  id: context.id,
  context_name: context.context_name,
  user_id: context.user_id,
};
  } catch (error) {
// Log validation error for debugging
console.error('Context ownership validation failed:', error);
return null;
  }
}

// =============================================================================
// OAuth Session Creation Helper
// =============================================================================

/**
 * Creates OAuth session with token generation and database insertion
 *
 * @param profileId - User profile ID for session ownership
 * @param clientId - OAuth client ID for session binding
 * @param returnUrl - Callback URL for session redirect
 * @param supabase - Authenticated Supabase client
 * @returns Promise<SessionCreationResult> - Session creation result with token
 */
export async function createOAuthSession(
  profileId: string,
  clientId: string,
  returnUrl: string,
  supabase: DatabaseClient,
): Promise<SessionCreationResult> {
  try {
// Step 1: Generate unique OAuth token using database function
const { data: tokenData, error: tokenError } = await supabase
  .rpc('generate_oauth_token')
  .single();

if (tokenError || !tokenData) {
  throw new Error(
`Token generation failed: ${tokenError?.message || 'Unknown error'}`,
  );
}

// Step 2: Calculate token expiration (2 hours from now)
const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

// Step 3: Insert OAuth session record
const { error: sessionError } = await supabase
  .from('oauth_sessions')
  .insert({
profile_id: profileId,
client_id: clientId,
session_token: tokenData,
expires_at: expiresAt,
return_url: returnUrl,
  });

if (sessionError) {
  throw new Error(`Session creation failed: ${sessionError.message}`);
}

// Return successful session creation result
return {
  session_token: tokenData,
  expires_at: expiresAt,
  success: true,
};
  } catch (error) {
// Log session creation error for debugging
console.error('OAuth session creation failed:', error);

// Return failure result
return {
  session_token: '',
  expires_at: '',
  success: false,
};
  }
}

// =============================================================================
// Redirect URL Builder Helper
// =============================================================================

/**
 * Builds complete redirect URL with token parameter
 *
 * @param returnUrl - Base return URL from authorization request
 * @param token - Generated OAuth session token
 * @returns string - Complete redirect URL with token parameter
 */
export function buildRedirectUrl(returnUrl: string, token: string): string {
  try {
// Parse return URL to handle existing query parameters
const url = new URL(returnUrl);

// Add token parameter to existing query string
url.searchParams.set('token', token);

// Return complete redirect URL
return url.toString();
  } catch (error) {
// Fallback for invalid URLs - use simple string concatenation
console.warn('URL parsing failed, using fallback method:', error);

// Simple parameter concatenation
const separator = returnUrl.includes('?') ? '&' : '?';
return `${returnUrl}${separator}token=${encodeURIComponent(token)}`;
  }
}

// =============================================================================
// Context Assignment Helper
// =============================================================================

/**
 * Assigns default context to OAuth client using database function
 *
 * @param profileId - User profile ID for context assignment
 * @param clientId - OAuth client ID for assignment
 * @param supabase - Authenticated Supabase client
 * @returns Promise<boolean> - Assignment success status
 */
export async function assignDefaultContextToApp(
  profileId: string,
  clientId: string,
  supabase: DatabaseClient,
): Promise<boolean> {
  try {
// Call database function for default context assignment
const { error: assignError } = await supabase.rpc(
  'assign_default_context_to_app',
  {
p_profile_id: profileId,
p_client_id: clientId,
  },
);

if (assignError) {
  console.error('Default context assignment failed:', assignError);
  return false;
}

return true;
  } catch (error) {
// Log assignment error for debugging
console.error('Context assignment helper failed:', error);
return false;
  }
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates OAuth token format follows tnp_[32 hex] pattern
 *
 * @param token - Token string to validate
 * @returns boolean - True if token format is valid
 */
export function validateTokenFormat(token: string): boolean {
  // Token format: tnp_ + 32 hex characters
  const tokenPattern = /^tnp_[a-f0-9]{32}$/;
  return tokenPattern.test(token);
}

/**
 * Validates return URL format and basic security requirements
 *
 * @param returnUrl - Return URL to validate
 * @returns boolean - True if URL format is valid
 */
export function validateReturnUrl(returnUrl: string): boolean {
  try {
const url = new URL(returnUrl);

// Basic security: require HTTPS in production
const isSecure =
  url.protocol === 'https:' ||
  url.hostname === 'localhost' ||
  url.hostname === '127.0.0.1';

return isSecure;
  } catch {
// Invalid URL format
return false;
  }
}
