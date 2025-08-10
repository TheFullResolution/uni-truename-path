-- TrueNamePath: Authentication Integration Migration
-- Step 1: Enable Supabase Authentication with Profile Linking
-- Date: August 10, 2025
-- Version: 1.2 (JWT Signing Keys System)

-- This migration integrates Supabase authentication with the existing profiles system
-- using foreign key constraints and automatic profile creation triggers.
-- 
-- NOTE: This migration does NOT add the foreign key constraint immediately
-- because existing demo profiles need to be migrated to real auth users first.
-- The constraint will be added in a separate step after auth user creation.

BEGIN;

-- =============================================================================
-- STEP 1: Prepare for auth integration (NO foreign key constraint yet)
-- =============================================================================

-- We cannot add the foreign key constraint yet because existing demo profiles
-- (with hardcoded UUIDs) don't have corresponding auth.users records.
-- This will be added manually after creating test auth users.

-- Log the preparation step
DO $$
BEGIN
  RAISE LOG 'TrueNamePath: Preparing for auth integration - foreign key will be added after auth user creation';
END $$;

-- =============================================================================
-- STEP 2: Create automatic profile creation function
-- =============================================================================

-- Function to automatically create a profile when a new auth user is created
-- Uses SECURITY DEFINER to ensure proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile record for new auth user
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (new.id, new.email, now());
  
  -- Log successful profile creation for debugging
  RAISE LOG 'TrueNamePath: Created profile for user % with email %', new.id, new.email;
  
  RETURN new;
  
EXCEPTION
  WHEN unique_violation THEN
-- Handle case where profile already exists
RAISE LOG 'TrueNamePath: Profile already exists for user %, skipping creation', new.id;
RETURN new;
  WHEN OTHERS THEN
-- Handle any other errors
RAISE EXCEPTION 'TrueNamePath: Failed to create profile for user %: %', new.id, SQLERRM;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a profile record when a new Supabase auth user is created';

-- =============================================================================
-- STEP 3: Attach trigger to auth.users table
-- =============================================================================

-- Create trigger that fires after INSERT on auth.users
-- This ensures every new auth user gets a corresponding profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Note: Cannot add comment on auth schema trigger due to permissions
-- Trigger purpose: Automatically creates profile records for new auth users

-- =============================================================================
-- STEP 4: Grant necessary permissions
-- =============================================================================

-- Ensure proper schema and table permissions for all roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.names TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consents TO authenticated;
GRANT SELECT, INSERT ON public.name_disclosure_log TO authenticated;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on functions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_name(uuid, text, text) TO authenticated;

-- =============================================================================
-- STEP 5: Validation and logging
-- =============================================================================

-- Log completion of migration
DO $$
BEGIN
  RAISE LOG 'TrueNamePath: Auth integration migration completed successfully';
  RAISE LOG 'TrueNamePath: - Auto-profile creation function created';
  RAISE LOG 'TrueNamePath: - Trigger attached to auth.users';
  RAISE LOG 'TrueNamePath: - Permissions granted for all roles';
  RAISE LOG 'TrueNamePath: - Foreign key constraint NOT added yet (requires auth user creation first)';
END $$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================

-- This migration prepares the database for Supabase authentication integration:
-- 
-- 1. AUTO-CREATION: New auth users automatically get profile records
-- 2. PERMISSIONS: All necessary grants for authenticated users
-- 3. LOGGING: Debug logs for profile creation tracking
-- 4. FOREIGN KEY: NOT added yet - requires auth user creation first
-- 
-- NEXT STEPS:
-- 1. Enable email/password auth in Supabase Dashboard
-- 2. Configure JWT Signing Keys system
-- 3. Update environment variables with new API keys
-- 4. Create test auth users for demo personas
-- 5. Add foreign key constraint after auth users exist:
--ALTER TABLE public.profiles ADD CONSTRAINT fk_auth_users 
--FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- 6. Migrate existing demo data to use real auth IDs
-- 
-- ROLLBACK PROCEDURE:
-- If rollback is needed, run:
-- - ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_auth_users;
-- - DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- - DROP FUNCTION IF EXISTS public.handle_new_user();