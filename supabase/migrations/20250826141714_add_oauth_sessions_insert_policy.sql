-- Migration: Add INSERT policy for oauth_sessions table
-- Date: 2025-08-26
-- Purpose: Fix OAuth authorization flow by allowing authenticated users to create their own sessions
-- Issue: Users could not create OAuth sessions due to missing INSERT RLS policy

-- ===
-- OAuth Sessions INSERT Policy
-- ===

/**
 * Allow authenticated users to create their own OAuth sessions
 * This policy ensures users can only create sessions where they are the profile owner
 * Fixes RLS policy violation error in OAuth authorization flow
 */
CREATE POLICY "oauth_sessions_own_insert" ON oauth_sessions
  FOR INSERT 
  TO authenticated 
  WITH CHECK (profile_id = auth.uid());

-- ===
-- Verification
-- ===

-- The oauth_sessions table should now have 4 policies:
-- 1. oauth_sessions_own_sessions (SELECT) - existing
-- 2. oauth_sessions_service_role_all (ALL) - existing  
-- 3. oauth_sessions_own_cleanup (DELETE) - existing
-- 4. oauth_sessions_own_insert (INSERT) - new

-- This completes the CRUD policy coverage for authenticated users:
-- - SELECT: Users can view their own sessions
-- - INSERT: Users can create their own sessions (NEW)
-- - DELETE: Users can delete their expired sessions
-- - UPDATE: Not needed (sessions are immutable after creation)