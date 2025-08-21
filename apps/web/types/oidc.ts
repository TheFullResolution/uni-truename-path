/**
 * OIDC Core 1.0 Compliant Type System for TrueNamePath (Simplified Schema)
 *
 * This module provides comprehensive TypeScript interfaces for OpenID Connect Core 1.0
 * compliance with TrueNamePath's context-aware identity management innovation.
 * Fully compliant with OIDC Core 1.0 and OAuth 2.0 standards.
 *
 * Academic Project: University Final Project (CM3035 Advanced Web Design)
 * Innovation: Context-aware name resolution within OIDC standard claims
 * Step 15.7.2: Simplified assignment structure without scope complexity
 */

import type { Enums } from '@/generated/database';

// =============================================================================
// OIDC Core 1.0 Standard Claims and Scopes
// =============================================================================

/**
 * Standard OIDC Claims (OIDC Core 1.0 Compliant)
 * @see https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
 */
export const STANDARD_OIDC_CLAIMS = [
  'sub',
  'name',
  'given_name',
  'family_name',
  'middle_name',
  'nickname',
  'preferred_username',
  'profile',
  'picture',
  'website',
  'email',
  'email_verified',
  'phone_number',
  'phone_number_verified',
  'address',
  'gender',
  'birthdate',
  'zoneinfo',
  'locale',
  'updated_at',
] as const;

export type StandardOIDCClaim = (typeof STANDARD_OIDC_CLAIMS)[number];

/**
 * TrueNamePath resolution source indicating how the name was resolved
 */
export type OIDCResolutionSource =
  | 'CONSENT' // Explicit user consent for this requester
  | 'CONTEXT' // Context-specific name assignment
  | 'PREFERRED_FALLBACK' // User's preferred name as fallback
  | 'LEGAL_FALLBACK'; // Legal name as last resort

// =============================================================================
// OIDC Request Interfaces
// =============================================================================

/**
 * OIDC-compliant resolution request (simplified structure)
 * Supports context-aware name resolution within OIDC standard patterns
 */
export interface OIDCResolveRequest {
  /** Target user whose identity claims are being resolved */
  target_user_id: string;

  /** Requesting user/application identifier (optional for public clients) */
  requester_user_id?: string;

  /** User-defined context name for context-aware resolution */
  context_name?: string;

  /** OAuth 2.0 scopes determining which claims to include in response */
  scopes?: Array<'openid' | 'profile' | 'email' | 'phone' | 'address'>;

  /** OAuth client_id or application identifier for analytics */
  client_id?: string;

  /** Additional request metadata */
  metadata?: {
user_agent?: string;
source_ip?: string;
session_id?: string;
  };
}

// =============================================================================
// OIDC Standard Claims (Core 1.0 Compliant)
// =============================================================================

/**
 * OIDC Core 1.0 Standard Claims
 * @see https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
 */
export interface OIDCStandardClaims {
  // === MANDATORY CLAIMS ===
  /** Subject identifier - unique user identifier */
  sub: string;

  // === PROFILE SCOPE CLAIMS ===
  /** Full name - TrueNamePath innovation: context-aware resolved name */
  name?: string;

  /** Given name (first name) */
  given_name?: string;

  /** Family name (last name) */
  family_name?: string;

  /** Middle name */
  middle_name?: string;

  /** Casual name */
  nickname?: string;

  /** Preferred username */
  preferred_username?: string;

  /** Profile page URL */
  profile?: string;

  /** Profile picture URL */
  picture?: string;

  /** Web page or blog URL */
  website?: string;

  /** Gender */
  gender?: string;

  /** Birthday (YYYY-MM-DD format) */
  birthdate?: string;

  /** Time zone database representing the user's time zone */
  zoneinfo?: string;

  /** Language tag representing the user's locale */
  locale?: string;

  /** Time the user's information was last updated (seconds since epoch) */
  updated_at?: number;

  // === EMAIL SCOPE CLAIMS ===
  /** Email address */
  email?: string;

  /** Email verification status */
  email_verified?: boolean;

  // === ADDRESS SCOPE CLAIMS ===
  /** Physical mailing address (JSON object or formatted string) */
  address?: {
formatted?: string;
street_address?: string;
locality?: string;
region?: string;
postal_code?: string;
country?: string;
  };

  // === PHONE SCOPE CLAIMS ===
  /** Phone number */
  phone_number?: string;

  /** Phone number verification status */
  phone_number_verified?: boolean;
}

// =============================================================================
// TrueNamePath OIDC Extensions
// =============================================================================

/**
 * TrueNamePath-specific extensions to OIDC claims (simplified structure)
 * These maintain OIDC compliance while adding our context-aware innovation
 */
export interface TrueNamePathOIDCExtensions {
  /** How the name was resolved (TrueNamePath innovation) */
  resolution_source: OIDCResolutionSource;

  /** Context used for name resolution (if applicable) */
  context_name?: string;

  /** Context ID used for resolution (if applicable) */
  context_id?: string;

  /** Processing time in milliseconds for performance monitoring */
  processing_time_ms?: number;

  /** Request metadata for analytics and debugging */
  request_metadata?: {
request_id: string;
timestamp: string;
scopes_applied: Array<'openid' | 'profile' | 'email' | 'phone' | 'address'>;
  };
}

/**
 * Complete OIDC response combining standard claims with TrueNamePath extensions
 */
export interface OIDCResolveResponse
  extends OIDCStandardClaims,
TrueNamePathOIDCExtensions {}

// =============================================================================
// Response Data Structures
// =============================================================================

/**
 * Complete OIDC resolution response data structure
 * JSend-compliant with OIDC claims and metadata
 */
export interface OIDCResolveResponseData {
  /** OIDC claims object */
  claims: OIDCResolveResponse;

  /** Additional response metadata for analytics and debugging */
  metadata: {
request_id: string;
timestamp: string;
processing_time_ms: number;
scopes_applied: Array<'openid' | 'profile' | 'email' | 'phone' | 'address'>;
analytics_logged?: boolean;
  };
}

// =============================================================================
// Database Integration Types
// =============================================================================

/**
 * Database result structure from simplified OIDC assignment system
 * Using generated database types for consistency with new schema
 */
export interface OIDCDatabaseResult {
  property_type: StandardOIDCClaim;
  property_value: string;
  source: string;
  context_id?: string;
  context_name?: string;
  assignment_id?: string;
}

// =============================================================================
// Simplified OIDC Assignment Types (Step 15.7.2)
// =============================================================================

// Simplified OIDC assignment interfaces removed - use OIDCAssignmentWithDetails from assignments/types.ts
// OIDC property assignments now handled by the simplified database schema

// =============================================================================
// Analytics Types
// =============================================================================

/**
 * Context usage analytics tracking data (simplified structure)
 */
export interface ContextUsageAnalytics {
  target_user_id: string;
  context_id?: string;
  requesting_application: string;
  application_type: 'oauth_client' | 'oidc_client' | 'api_integration';
  scopes_requested: Array<'openid' | 'profile' | 'email' | 'phone' | 'address'>;
  properties_disclosed: Array<{
property: Enums<'oidc_property'>;
value: string;
assignment_id: string;
  }>;
  response_time_ms: number;
  success: boolean;
  error_type?: string;
  source_ip?: string;
  user_agent?: string;
  session_id?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Utility Types
// =============================================================================
