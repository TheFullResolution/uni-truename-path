import { type NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
import { NextResponse } from 'next/server';

/**
 * Official Supabase SSR Middleware for Route Protection
 *
 * Uses the official Supabase SSR middleware pattern with updateSession
 * for automatic token refresh, proper cookie management, and route protection.
 *
 * Route protection logic is handled in utils/supabase/middleware.ts
 */

/**
 * Main middleware function using official Supabase SSR pattern
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets, API routes, and Next.js internals
  if (
pathname.startsWith('/_next/') ||
pathname.startsWith('/api/') ||
pathname.startsWith('/favicon') ||
pathname.includes('.')
  ) {
return NextResponse.next();
  }

  // Use the official updateSession pattern - this handles both authentication
  // and route protection in a single, simplified approach
  return await updateSession(request);
}

/**
 * Middleware configuration
 * Apply to all routes except static assets and API routes
 */
export const config = {
  matcher: [
/*
 * Match all request paths except for the ones starting with:
 * - api (API routes)
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - public assets (images, etc.)
 */
'/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
