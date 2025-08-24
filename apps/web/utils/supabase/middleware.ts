import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  extractBearerToken,
  validateOAuthToken,
  type OAuthSessionWithProfile,
} from '../api/oauth-helpers';
import type { Tables } from '@/generated/database';
import {
  classifyRoute,
  getAllowedHeadersForRoute,
  isHeaderAllowedForRoute,
} from '../api/route-security-classifier';

// Define protected route patterns
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings'];

// Define public routes that should never redirect
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/',
];

// Define public API routes that don't require authentication
const PUBLIC_API_ROUTES: string[] = [];

/**
 * Check if a given pathname matches any protected route patterns
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if a given pathname is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
(route) =>
  pathname === route || (route !== '/' && pathname.startsWith(route)),
  );
}

/**
 * Check if a given pathname is an API route
 */
function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

/**
 * Check if a given pathname is a public API route that doesn't require authentication
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Set authentication headers based on user authentication state and route security classification
 * SECURITY-AWARE: Only sets headers that are appropriate for the route's security level
 * Prevents GDPR violations by not exposing personal data to OAuth public routes
 */
function setAuthHeaders(
  response: NextResponse,
  pathname: string,
  user: { id: string; email?: string | null } | null,
  isOAuth: boolean,
  oauthSession: OAuthSessionWithProfile | null,
  profile: Tables<'profiles'> | null,
): void {
  // Classify route to determine appropriate header exposure
  const securityLevel = classifyRoute(pathname);
  const allowedHeaders = getAllowedHeadersForRoute(pathname);

  // Log security classification for debugging in development
  if (process.env.NODE_ENV === 'development') {
console.log(
  `[Security] Route: ${pathname}, Level: ${securityLevel}, Headers: ${allowedHeaders.length}`,
);
  }

  if (!user) {
// No authentication - set minimal default headers only if allowed
if (isHeaderAllowedForRoute('x-authentication-verified', pathname)) {
  response.headers.set('x-authentication-verified', 'false');
}
if (isHeaderAllowedForRoute('x-authenticated-user-id', pathname)) {
  response.headers.set('x-authenticated-user-id', '');
}
if (isHeaderAllowedForRoute('x-authenticated-user-email', pathname)) {
  response.headers.set('x-authenticated-user-email', '');
}
if (isHeaderAllowedForRoute('x-oauth-authenticated', pathname)) {
  response.headers.set('x-oauth-authenticated', 'false');
}
return;
  }

  // Set authentication headers based on security classification
  if (isHeaderAllowedForRoute('x-authentication-verified', pathname)) {
response.headers.set('x-authentication-verified', 'true');
  }

  if (isHeaderAllowedForRoute('x-authenticated-user-id', pathname)) {
response.headers.set('x-authenticated-user-id', user.id);
  }

  // CRITICAL: Only set email header for internal app routes (GDPR compliance)
  if (isHeaderAllowedForRoute('x-authenticated-user-email', pathname)) {
response.headers.set('x-authenticated-user-email', user.email || '');
  }

  if (isOAuth && oauthSession) {
// Set OAuth-specific headers only if allowed
if (isHeaderAllowedForRoute('x-oauth-authenticated', pathname)) {
  response.headers.set('x-oauth-authenticated', 'true');
}
if (isHeaderAllowedForRoute('x-oauth-session-id', pathname)) {
  response.headers.set('x-oauth-session-id', oauthSession.id);
}
if (isHeaderAllowedForRoute('x-oauth-app-id', pathname)) {
  response.headers.set('x-oauth-app-id', oauthSession.app_id);
}
  } else {
// Set cookie auth headers only if allowed
if (isHeaderAllowedForRoute('x-oauth-authenticated', pathname)) {
  response.headers.set('x-oauth-authenticated', 'false');
}
  }

  // CRITICAL: Only include profile data for internal app routes (GDPR compliance)
  if (
profile &&
isHeaderAllowedForRoute('x-authenticated-user-profile', pathname)
  ) {
response.headers.set(
  'x-authenticated-user-profile',
  JSON.stringify(profile),
);
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
request,
  });

  const supabase = createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{
  cookies: {
getAll() {
  return request.cookies.getAll();
},
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value }) =>
request.cookies.set(name, value),
  );
  supabaseResponse = NextResponse.next({
request,
  });
  cookiesToSet.forEach(({ name, value, options }) =>
supabaseResponse.cookies.set(name, value, options),
  );
},
  },
},
  );

  const pathname = request.nextUrl.pathname;

  // Perform authentication check (single source of truth)
  // Support both OAuth Bearer tokens and cookie-based sessions
  let user = null;
  let isOAuthAuth = false;
  let oauthSession = null;

  // Handle API routes with header-based communication
  if (isApiRoute(pathname)) {
// Check for OAuth Bearer token first
const authHeader = request.headers.get('authorization');
const bearerToken = extractBearerToken(authHeader);

if (bearerToken) {
  // Validate OAuth token
  const validation = await validateOAuthToken(bearerToken);

  if (validation.success && validation.session) {
// OAuth authentication successful
isOAuthAuth = true;
oauthSession = validation.session;
user = {
  id: validation.session.profile_id,
  email: validation.session.profiles.email,
};
  }
}

// Fall back to cookie authentication if no valid OAuth token
if (!isOAuthAuth) {
  const {
data: { user: cookieUser },
  } = await supabase.auth.getUser();
  user = cookieUser;
}

// For public API routes, set headers indicating no authentication required
if (isPublicApiRoute(pathname)) {
  setAuthHeaders(supabaseResponse, pathname, null, false, null, null);
  return supabaseResponse;
}

// For protected API routes, set authentication headers
let profile = null;

if (user && isOAuthAuth && oauthSession) {
  // Use profile from OAuth session
  profile = oauthSession.profiles;
} else if (user) {
  // Fetch user profile for cookie auth
  const { data: profileData, error: profileError } = await supabase
.from('profiles')
.select('*')
.eq('id', user.id)
.single();

  if (profileError && profileError.code !== 'PGRST116') {
console.warn(
  'Could not fetch user profile in middleware:',
  profileError.message,
);
  }
  profile = profileData;
}

// Set all authentication headers using helper function with route-aware security
setAuthHeaders(
  supabaseResponse,
  pathname,
  user,
  isOAuthAuth,
  oauthSession,
  profile,
);

return supabaseResponse;
  }

  // For page routes, use cookie authentication only
  const {
data: { user: cookieUser },
  } = await supabase.auth.getUser();
  user = cookieUser;

  // Handle page routes with redirect logic (existing behavior)

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
return supabaseResponse;
  }

  // For protected routes, check authentication and redirect if needed
  if (isProtectedRoute(pathname) && !user) {
const url = request.nextUrl.clone();
url.pathname = '/auth/login';
url.searchParams.set('returnUrl', pathname);
return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
