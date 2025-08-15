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

  const {
data: { user },
  } = await supabase.auth.getUser();

  // Allow public routes without authentication
  if (isPublicRoute(request.nextUrl.pathname)) {
return supabaseResponse;
  }

  // For protected routes, check authentication and redirect if needed
  if (isProtectedRoute(request.nextUrl.pathname) && !user) {
const url = request.nextUrl.clone();
url.pathname = '/auth/login';
url.searchParams.set('returnUrl', request.nextUrl.pathname);
return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
