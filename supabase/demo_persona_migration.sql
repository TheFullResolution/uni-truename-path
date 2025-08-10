-- TrueNamePath: Demo Persona Migration Script
-- Purpose: Migrate existing hardcoded demo personas to real Supabase auth users
-- Date: August 10, 2025
-- 
-- PREREQUISITES: ✅ COMPLETED
-- 1. ✅ Auth users created in Supabase Dashboard:
--- jj@truename.test (UID: 54c00e81-cda9-4251-9456-7778df91b988)
--- liwei@truename.test (UID: 809d0224-81f1-48a0-9405-2258de21ea60) 
--- alex@truename.test (UID: 257113c8-7a62-4758-9b1b-7992dd8aca1e)
-- 2. ✅ UUIDs captured and updated in this script
-- 3. ✅ SCRIPT IS READY TO EXECUTE

-- =============================================================================
-- MIGRATION SCRIPT - READY TO EXECUTE WITH REAL AUTH USER IDs
-- =============================================================================

-- ✅ READY: All UUIDs have been updated with actual auth.users.id values
-- from Supabase Dashboard. This script is ready to execute.

BEGIN;

-- Create savepoint for rollback capability
SAVEPOINT migration_start;

-- Variables for auth user IDs (UPDATED WITH ACTUAL VALUES)
-- Retrieved from Supabase Dashboard -> Auth -> Users after account creation
DO $$
DECLARE
  jj_auth_id uuid := '54c00e81-cda9-4251-9456-7778df91b988'::uuid;  -- jj@truename.test
  liwei_auth_id uuid := '809d0224-81f1-48a0-9405-2258de21ea60'::uuid; -- liwei@truename.test  
  alex_auth_id uuid := '257113c8-7a62-4758-9b1b-7992dd8aca1e'::uuid;   -- alex@truename.test
  
  -- Original demo IDs
  jj_demo_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  liwei_demo_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  alex_demo_id uuid := '33333333-3333-3333-3333-333333333333'::uuid;
  
  update_count integer;
BEGIN
  -- Verify that we have valid UUIDs (not placeholder values)
  IF jj_auth_id = '00000000-0000-0000-0000-000000000000'::uuid OR
 liwei_auth_id = '00000000-0000-0000-0000-000000000000'::uuid OR 
 alex_auth_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
RAISE EXCEPTION 'Invalid UUID provided - please check auth user IDs';
  END IF;
  
  -- Verify all auth users exist before migration
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = jj_auth_id AND email = 'jj@truename.test') THEN
RAISE EXCEPTION 'JJ auth user not found with email jj@truename.test';
  END IF;
  
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = liwei_auth_id AND email = 'liwei@truename.test') THEN
RAISE EXCEPTION 'Li Wei auth user not found with email liwei@truename.test';
  END IF;
  
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = alex_auth_id AND email = 'alex@truename.test') THEN
RAISE EXCEPTION 'Alex auth user not found with email alex@truename.test';
  END IF;
  
  RAISE LOG 'All auth users verified, starting migration...';
  
  -- =============================================================================
  -- UPDATE PROFILES TABLE
  -- =============================================================================
  
  -- Update JJ profile
  UPDATE public.profiles SET 
id = jj_auth_id,
email = 'jj@truename.test'
  WHERE id = jj_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  IF update_count = 0 THEN
RAISE EXCEPTION 'Failed to update JJ profile - original profile not found';
  END IF;
  RAISE LOG 'Updated JJ profile: % -> %', jj_demo_id, jj_auth_id;
  
  -- Update Li Wei profile  
  UPDATE public.profiles SET 
id = liwei_auth_id,
email = 'liwei@truename.test'
  WHERE id = liwei_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  IF update_count = 0 THEN
RAISE EXCEPTION 'Failed to update Li Wei profile - original profile not found';
  END IF;
  RAISE LOG 'Updated Li Wei profile: % -> %', liwei_demo_id, liwei_auth_id;
  
  -- Update Alex profile
  UPDATE public.profiles SET 
id = alex_auth_id,
email = 'alex@truename.test'  
  WHERE id = alex_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  IF update_count = 0 THEN
RAISE EXCEPTION 'Failed to update Alex profile - original profile not found';
  END IF;
  RAISE LOG 'Updated Alex profile: % -> %', alex_demo_id, alex_auth_id;
  
  -- =============================================================================
  -- UPDATE RELATED TABLES (CASCADE UPDATE)
  -- =============================================================================
  
  -- Update names table
  UPDATE public.names SET profile_id = jj_auth_id WHERE profile_id = jj_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % name records for JJ', update_count;
  
  UPDATE public.names SET profile_id = liwei_auth_id WHERE profile_id = liwei_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % name records for Li Wei', update_count;
  
  UPDATE public.names SET profile_id = alex_auth_id WHERE profile_id = alex_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % name records for Alex', update_count;
  
  -- Update consents table
  UPDATE public.consents SET profile_id = jj_auth_id WHERE profile_id = jj_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % consent records for JJ', update_count;
  
  UPDATE public.consents SET profile_id = liwei_auth_id WHERE profile_id = liwei_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % consent records for Li Wei', update_count;
  
  UPDATE public.consents SET profile_id = alex_auth_id WHERE profile_id = alex_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % consent records for Alex', update_count;
  
  -- Update name_disclosure_log table  
  UPDATE public.name_disclosure_log SET profile_id = jj_auth_id WHERE profile_id = jj_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % disclosure log records for JJ', update_count;
  
  UPDATE public.name_disclosure_log SET profile_id = liwei_auth_id WHERE profile_id = liwei_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % disclosure log records for Li Wei', update_count;
  
  UPDATE public.name_disclosure_log SET profile_id = alex_auth_id WHERE profile_id = alex_demo_id;
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE LOG 'Updated % disclosure log records for Alex', update_count;
  
  RAISE LOG 'Migration completed successfully - all demo personas migrated to auth users';
  
END $$;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify migration results
SELECT 'PROFILES' as table_name, count(*) as record_count FROM public.profiles
UNION ALL
SELECT 'NAMES' as table_name, count(*) as record_count FROM public.names  
UNION ALL
SELECT 'CONSENTS' as table_name, count(*) as record_count FROM public.consents
UNION ALL
SELECT 'DISCLOSURE_LOG' as table_name, count(*) as record_count FROM public.name_disclosure_log;

-- Show updated profiles with new auth-linked IDs
SELECT p.id, p.email, au.email as auth_email, p.created_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
ORDER BY p.email;

-- =============================================================================
-- USAGE INSTRUCTIONS - READY TO EXECUTE
-- =============================================================================

-- ✅ CURRENT STATUS: All prerequisites completed, script ready to run
-- 
-- ✅ 1. Auth users created in Supabase Dashboard:
--- jj@truename.test (UID: 54c00e81-cda9-4251-9456-7778df91b988)
--- liwei@truename.test (UID: 809d0224-81f1-48a0-9405-2258de21ea60)
--- alex@truename.test (UID: 257113c8-7a62-4758-9b1b-7992dd8aca1e)
-- 
-- ✅ 2. UUIDs updated in this script
-- 
-- ⏳ 3. NEXT STEP: Run this script in Supabase SQL Editor with service_role permissions
-- 
-- ⏳ 4. After successful migration, run the foreign key constraint migration:
--20250810120001_add_auth_foreign_key.sql
-- 
-- ⏳ 5. Test the context engine with new auth-linked profiles