-- TrueNamePath: Add Foreign Key Constraint After Auth User Creation
-- Step 1.2: Link profiles to auth.users with foreign key constraint
-- Date: August 10, 2025
-- 
-- This migration adds the foreign key constraint that links profiles.id to auth.users.id
-- It should be run AFTER creating auth users for existing demo personas.
--
-- PREREQUISITE: Auth users must exist for all current profile IDs
-- 
-- USAGE:
-- - AUTOMATED (CI/Local Reset): Skips constraint addition if no auth users exist
-- - MANUAL (Production): Creates auth users first, then applies constraint
-- 
-- TO MANUALLY APPLY THIS MIGRATION IN PRODUCTION:
-- 1. First create auth users in Supabase Dashboard for demo personas
-- 2. Update existing profile IDs to match auth user IDs
-- 3. Then run this migration to add the foreign key constraint

BEGIN;

-- =============================================================================
-- STEP 1: Verify all profiles have corresponding auth users
-- =============================================================================

-- Check that all existing profiles have matching auth users
-- In automated environments (CI/local reset), skip constraint if no auth users exist
DO $$
DECLARE
  profile_record RECORD;
  auth_count INTEGER;
  orphan_count INTEGER := 0;
  total_auth_users INTEGER := 0;
BEGIN
  -- Check if ANY auth users exist (excludes system users)
  SELECT COUNT(*) INTO total_auth_users 
  FROM auth.users 
  WHERE email NOT LIKE '%@supabase.io' 
AND email NOT LIKE '%@localhost';
  
  -- If no auth users exist, this is likely an automated environment
  IF total_auth_users = 0 THEN
RAISE LOG 'TrueNamePath: No auth users found - skipping foreign key constraint (automated environment)';
RAISE LOG 'TrueNamePath: To manually apply constraint, create auth users first then re-run migration';
-- Exit early without adding constraint
RETURN;
  END IF;
  
  -- Check each profile for corresponding auth user
  FOR profile_record IN SELECT id, email FROM public.profiles LOOP
SELECT COUNT(*) INTO auth_count 
FROM auth.users 
WHERE id = profile_record.id;

IF auth_count = 0 THEN
  RAISE WARNING 'Profile % (%) has no corresponding auth user', 
profile_record.id, profile_record.email;
  orphan_count := orphan_count + 1;
END IF;
  END LOOP;
  
  -- If orphan profiles exist, provide clear resolution path
  IF orphan_count > 0 THEN
RAISE EXCEPTION 'Found % profiles without corresponding auth users. RESOLUTION STEPS: 1) Go to Supabase Dashboard → Authentication → Users, 2) Create auth users with emails matching profile emails, 3) Update profile IDs using the data migration script in step-01-auth-architecture-plan.md, 4) Re-run this migration. Orphaned profiles found: %', 
  orphan_count, (SELECT string_agg(id::text || ' (' || email || ')', ', ') FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users));
  END IF;
  
  RAISE LOG 'TrueNamePath: All profiles have corresponding auth users - proceeding with foreign key';
END $$;

-- =============================================================================
-- STEP 2: Add foreign key constraint (conditional)
-- =============================================================================

-- Add foreign key constraint only if auth users exist
DO $$
DECLARE
  total_auth_users INTEGER := 0;
  constraint_exists BOOLEAN := FALSE;
BEGIN
  -- Check if ANY auth users exist (excludes system users)
  SELECT COUNT(*) INTO total_auth_users 
  FROM auth.users 
  WHERE email NOT LIKE '%@supabase.io' 
AND email NOT LIKE '%@localhost';
  
  -- Check if constraint already exists
  SELECT EXISTS (
SELECT 1 FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'public'
  AND t.relname = 'profiles'
  AND c.conname = 'fk_auth_users'
  AND c.contype = 'f'
  ) INTO constraint_exists;
  
  -- Skip if no auth users exist (automated environment)
  IF total_auth_users = 0 THEN
RAISE LOG 'TrueNamePath: Skipping foreign key constraint - no auth users (automated environment)';
RETURN;
  END IF;
  
  -- Skip if constraint already exists
  IF constraint_exists THEN
RAISE LOG 'TrueNamePath: Foreign key constraint already exists - skipping';
RETURN;
  END IF;
  
  -- Add foreign key constraint to link profiles.id directly to auth.users.id
  -- This ensures data integrity and enables CASCADE operations
  ALTER TABLE public.profiles 
ADD CONSTRAINT fk_auth_users 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

  RAISE LOG 'TrueNamePath: Foreign key constraint fk_auth_users added successfully';
  RAISE LOG 'TrueNamePath: profiles.id now linked to auth.users.id with CASCADE delete';
END $$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION VERIFICATION
-- =============================================================================

-- Verify the constraint was added correctly (conditional)
DO $$
DECLARE
  constraint_count INTEGER;
  total_auth_users INTEGER := 0;
BEGIN
  -- Check if auth users exist (same logic as above)
  SELECT COUNT(*) INTO total_auth_users 
  FROM auth.users 
  WHERE email NOT LIKE '%@supabase.io' 
AND email NOT LIKE '%@localhost';
  
  -- Skip verification if no auth users (automated environment)
  IF total_auth_users = 0 THEN
RAISE LOG 'TrueNamePath: Skipping constraint verification - automated environment';
RETURN;
  END IF;
  
  -- Verify constraint exists when auth users are present
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
AND t.relname = 'profiles'
AND c.conname = 'fk_auth_users'
AND c.contype = 'f';

  IF constraint_count = 1 THEN
RAISE LOG 'TrueNamePath: Foreign key constraint verification successful';
  ELSE
RAISE EXCEPTION 'TrueNamePath: Foreign key constraint verification failed';
  END IF;
END $$;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================

-- This migration completes the auth integration by adding the foreign key constraint:
-- 
-- 1. VERIFICATION: Checks all profiles have corresponding auth users
-- 2. CONSTRAINT: Links profiles.id to auth.users.id with CASCADE delete
-- 3. VALIDATION: Verifies constraint was added correctly
-- 
-- NEXT STEPS:
-- 1. Test profile creation with new auth users
-- 2. Verify CASCADE delete behavior
-- 3. Test context engine with real authentication
-- 4. Implement login/signup UI components
-- 
-- ROLLBACK PROCEDURE:
-- If rollback is needed, run:
-- - ALTER TABLE public.profiles DROP CONSTRAINT fk_auth_users;