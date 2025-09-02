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

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings'];

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/docs',
  '/',
];

const PUBLIC_API_ROUTES: string[] = [];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
(route) =>
  pathname === route || (route !== '/' && pathname.startsWith(route)),
  );
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

function setAuthHeaders(
  response: NextResponse,
  pathname: string,
  user: { id: string; email?: string | null } | null,
  isOAuth: boolean,
  oauthSession: OAuthSessionWithProfile | null,
  profile: Tables<'profiles'> | null,
): void {
  const securityLevel = classifyRoute(pathname);
  const allowedHeaders = getAllowedHeadersForRoute(pathname);

  if (process.env.NODE_ENV === 'development') {
console.log(
  `[Security] Route: ${pathname}, Level: ${securityLevel}, Headers: ${allowedHeaders.length}`,
);
  }

  if (!user) {
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

  if (isHeaderAllowedForRoute('x-authentication-verified', pathname)) {
response.headers.set('x-authentication-verified', 'true');
  }

  if (isHeaderAllowedForRoute('x-authenticated-user-id', pathname)) {
response.headers.set('x-authenticated-user-id', user.id);
  }

  if (isHeaderAllowedForRoute('x-authenticated-user-email', pathname)) {
response.headers.set('x-authenticated-user-email', user.email || '');
  }

  if (isOAuth && oauthSession) {
if (isHeaderAllowedForRoute('x-oauth-authenticated', pathname)) {
  response.headers.set('x-oauth-authenticated', 'true');
}
if (isHeaderAllowedForRoute('x-oauth-session-id', pathname)) {
  response.headers.set('x-oauth-session-id', oauthSession.id);
}
if (isHeaderAllowedForRoute('x-oauth-client-id', pathname)) {
  response.headers.set('x-oauth-client-id', oauthSession.client_id);
}
  } else {
if (isHeaderAllowedForRoute('x-oauth-authenticated', pathname)) {
  response.headers.set('x-oauth-authenticated', 'false');
}
  }
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

  let user = null;
  let isOAuthAuth = false;
  let oauthSession = null;

  if (isApiRoute(pathname)) {
const authHeader = request.headers.get('authorization');
const bearerToken = extractBearerToken(authHeader);

if (bearerToken) {
  const validation = await validateOAuthToken(bearerToken);

  if (validation.success && validation.session) {
isOAuthAuth = true;
oauthSession = validation.session;
user = {
  id: validation.session.profile_id,
  email: validation.session.profiles.email,
};
  }
}
if (!isOAuthAuth) {
  const {
data: { user: cookieUser },
  } = await supabase.auth.getUser();
  user = cookieUser;
}

if (isPublicApiRoute(pathname)) {
  setAuthHeaders(supabaseResponse, pathname, null, false, null, null);
  return supabaseResponse;
}

let profile = null;

if (user && isOAuthAuth && oauthSession) {
  profile = oauthSession.profiles;
} else if (user) {
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

  const {
data: { user: cookieUser },
  } = await supabase.auth.getUser();
  user = cookieUser;

  if (isPublicRoute(pathname)) {
return supabaseResponse;
  }
  if (isProtectedRoute(pathname) && !user) {
const url = request.nextUrl.clone();
url.pathname = '/auth/login';
url.searchParams.set('returnUrl', pathname);
return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
