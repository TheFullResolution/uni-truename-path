import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Define protected route patterns
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/contexts'];

// Define public routes that should never redirect
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/',
];

// Define public API routes that don't require authentication
const PUBLIC_API_ROUTES = ['/api/names/resolve'];

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
  // Use cookie-based session only
  let user = null;

  const {
data: { user: cookieUser },
  } = await supabase.auth.getUser();
  user = cookieUser;

  // Handle API routes with header-based communication
  if (isApiRoute(pathname)) {
// For public API routes, set headers indicating no authentication required
if (isPublicApiRoute(pathname)) {
  supabaseResponse.headers.set('x-authentication-verified', 'false');
  supabaseResponse.headers.set('x-authenticated-user-id', '');
  supabaseResponse.headers.set('x-authenticated-user-email', '');
  return supabaseResponse;
}

// For protected API routes, set authentication headers
if (user) {
  // Fetch user profile for HOF compatibility
  const { data: profile, error: profileError } = await supabase
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

  // Set secure headers with authenticated user data
  supabaseResponse.headers.set('x-authentication-verified', 'true');
  supabaseResponse.headers.set('x-authenticated-user-id', user.id);
  supabaseResponse.headers.set(
'x-authenticated-user-email',
user.email || '',
  );

  // Include profile data as JSON if available
  if (profile) {
supabaseResponse.headers.set(
  'x-authenticated-user-profile',
  JSON.stringify(profile),
);
  }
} else {
  // No authentication for protected API route
  supabaseResponse.headers.set('x-authentication-verified', 'false');
  supabaseResponse.headers.set('x-authenticated-user-id', '');
  supabaseResponse.headers.set('x-authenticated-user-email', '');
}

return supabaseResponse;
  }

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
