// TrueNamePath: Dashboard Statistics API Route
// GET /api/dashboard/stats - Retrieve comprehensive dashboard statistics for authenticated user
// Date: August 13, 2025
// Academic project REST API with JSend compliance and optimized performance

import { NextRequest } from 'next/server';
import {
  withRequiredAuth,
  createSuccessResponse,
  createErrorResponse,
  type AuthenticatedHandler,
} from '../../../../lib/api';
import { ErrorCodes } from '../../../../lib/api';
import {
  type NameCategory,
  type DashboardStats,
} from '../../../../types/database';

// Using centralized DashboardStats type from database types

/**
 * Authenticated handler for dashboard statistics retrieval
 * Uses parallel database queries for optimal performance
 */
const getDashboardStats: AuthenticatedHandler = async (
  request: NextRequest,
  { user, supabase, requestId, timestamp },
) => {
  try {
if (!user?.profile?.id) {
  return createErrorResponse(
ErrorCodes.AUTHENTICATION_REQUIRED,
'User profile not found',
requestId,
undefined,
timestamp,
  );
}

const profileId = user.profile.id;

// Execute all queries in parallel for optimal performance
const [
  namesResult,
  contextsResult,
  consentsResult,
  auditResult,
  recentActivityResult,
] = await Promise.all([
  // Query 1: Name variants statistics
  supabase
.from('names')
.select('name_type, is_preferred')
.eq('user_id', profileId),

  // Query 2: User-defined contexts count
  supabase
.from('user_contexts')
.select('id', { count: 'exact', head: true })
.eq('user_id', profileId),

  // Query 3: Consent statistics
  supabase
.from('consents')
.select('status', { count: 'exact' })
.eq('granter_user_id', profileId),

  // Query 4: Total audit entries
  supabase
.from('audit_log_entries')
.select('id', { count: 'exact', head: true })
.eq('target_user_id', profileId),

  // Query 5: Recent activity (last 7 days)
  supabase
.from('audit_log_entries')
.select('action, accessed_at')
.eq('target_user_id', profileId)
.gte(
  'accessed_at',
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
),
]);

// Check for database errors
if (namesResult.error) {
  console.error('Names query error:', namesResult.error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve name statistics',
requestId,
undefined,
timestamp,
  );
}

if (contextsResult.error) {
  console.error('Contexts query error:', contextsResult.error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve context statistics',
requestId,
undefined,
timestamp,
  );
}

if (consentsResult.error) {
  console.error('Consents query error:', consentsResult.error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve consent statistics',
requestId,
undefined,
timestamp,
  );
}

if (auditResult.error) {
  console.error('Audit query error:', auditResult.error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve audit statistics',
requestId,
undefined,
timestamp,
  );
}

if (recentActivityResult.error) {
  console.error('Recent activity query error:', recentActivityResult.error);
  return createErrorResponse(
ErrorCodes.DATABASE_ERROR,
'Failed to retrieve recent activity',
requestId,
undefined,
timestamp,
  );
}

// Process name statistics
const names = namesResult.data || [];
const namesByType: Record<NameCategory, number> = {
  LEGAL: 0,
  PREFERRED: 0,
  NICKNAME: 0,
  ALIAS: 0,
  PROFESSIONAL: 0,
  CULTURAL: 0,
};

let hasPreferredName = false;

names.forEach((name) => {
  if (name.name_type in namesByType) {
namesByType[name.name_type]++;
  }
  if (name.is_preferred) {
hasPreferredName = true;
  }
});

// Process consent statistics
const consents = consentsResult.data || [];
const activeConsents = consents.filter(
  (c) => c.status === 'GRANTED',
).length;
const pendingRequests = consents.filter(
  (c) => c.status === 'PENDING',
).length;

// Process activity statistics
const recentActivity = recentActivityResult.data || [];
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const apiCallsToday = recentActivity.filter(
  (entry) => new Date(entry.accessed_at) >= todayStart,
).length;

// Calculate privacy score (simplified algorithm)
let privacyScore = 50; // Base score

// Increase score for having name variants
if (names.length > 0) privacyScore += 20;
if (hasPreferredName) privacyScore += 10;

// Increase score for context management
const customContexts = contextsResult.count || 0;
if (customContexts > 0) privacyScore += 15;

// Increase score for consent management
if (activeConsents > 0) privacyScore += 5;

// Ensure score is within bounds
privacyScore = Math.min(100, Math.max(0, privacyScore));

// Determine GDPR compliance status
const gdprCompliant = names.length > 0 && (auditResult.count || 0) > 0;

// Calculate member since date (use user creation or profile creation)
const memberSince = user.created_at || new Date().toISOString();

// Construct response
const dashboardStats: DashboardStats = {
  user_profile: {
email: user.email || '',
profile_id: profileId,
member_since: memberSince,
  },
  name_statistics: {
total_names: names.length,
names_by_type: namesByType,
has_preferred_name: hasPreferredName,
  },
  context_statistics: {
custom_contexts: customContexts,
active_consents: activeConsents,
pending_consent_requests: pendingRequests,
  },
  activity_metrics: {
recent_activity_count: recentActivity.length,
api_calls_today: apiCallsToday,
total_api_calls: auditResult.count || 0,
  },
  privacy_metrics: {
privacy_score: privacyScore,
gdpr_compliance_status: gdprCompliant ? 'compliant' : 'needs_attention',
audit_retention_days: 365, // Standard GDPR retention
  },
};

return createSuccessResponse(dashboardStats, requestId, timestamp);
  } catch (error) {
console.error('Dashboard stats error:', error);
return createErrorResponse(
  ErrorCodes.INTERNAL_SERVER_ERROR,
  'Failed to retrieve dashboard statistics',
  requestId,
  undefined,
  timestamp,
);
  }
};

/**
 * GET /api/dashboard/stats
 * Retrieve comprehensive dashboard statistics for the authenticated user
 *
 * Authentication: Required (JWT token)
 * Rate limiting: Standard API rate limits apply
 *
 * Response format: JSend compliant
 * - success: true/false
 * - data: DashboardStats object
 * - message: Error message if applicable
 * - requestId: Unique request identifier
 * - timestamp: Response timestamp
 */
export const GET = withRequiredAuth(getDashboardStats);
