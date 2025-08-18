import { type NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';
import { NextResponse } from 'next/server';

/**
 * Middleware-First Authentication System
 *
 * This middleware now handles BOTH page routes AND API routes to create a single
 * source of truth for authentication, eliminating duplicate auth calls.
 *
 * For page routes: Handles redirects and route protection
 * For API routes: Sets authentication headers for HOF consumption
 *
 * Route protection and header logic is handled in utils/supabase/middleware.ts
 */

/**
 * Main middleware function implementing middleware-first authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and Next.js internals only
  // Note: API routes are now included in middleware processing
  if (
pathname.startsWith('/_next/') ||
pathname.startsWith('/favicon') ||
pathname.includes('.')
  ) {
return NextResponse.next();
  }

  // Use the enhanced updateSession pattern that handles both pages and API routes
  // This creates a single authentication verification point for the entire application
  return await updateSession(request);
}

/**
 * Middleware configuration
 * Apply to ALL routes except static assets (API routes are now included)
 */
export const config = {
  matcher: [
/*
 * Match all request paths except for the ones starting with:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - public assets (images, etc.)
 * Note: API routes are now INCLUDED for authentication header processing
 */
'/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
