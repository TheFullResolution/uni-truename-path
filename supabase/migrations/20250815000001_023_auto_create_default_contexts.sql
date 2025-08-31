-- TrueNamePath: Migration 023 - Auto-Create Default Contexts
-- Purpose: Automatically create default contexts for users on profile creation
-- Status: Production-ready with comprehensive error handling

BEGIN;

-- ===
-- STEP 1: Create function to auto-create default contexts
-- ===

-- Drop trigger first for safe redeployment
DROP TRIGGER IF EXISTS trigger_create_default_contexts ON public.profiles;

-- Create enhanced function to create default contexts for new users
CREATE OR REPLACE FUNCTION public.create_default_contexts_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert default contexts with ON CONFLICT DO NOTHING for safety
  -- This handles concurrent inserts and migration reruns gracefully
  
  INSERT INTO public.user_contexts (user_id, context_name, description, created_at, updated_at)
  VALUES 
(
  NEW.id, 
  'Professional', 
  'Work and professional interactions', 
  now(), 
  now()
),
(
  NEW.id, 
  'Social', 
  'Friends and social networks', 
  now(), 
  now()
),
(
  NEW.id, 
  'Public', 
  'Public facing profiles and websites', 
  now(), 
  now()
)
  ON CONFLICT (user_id, context_name) DO NOTHING;
  
  -- Log successful context creation for debugging
  RAISE LOG 'TrueNamePath: Created default contexts for user %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
-- Handle any errors gracefully without breaking profile creation
RAISE LOG 'TrueNamePath: Failed to create default contexts for user %: %', NEW.id, SQLERRM;
-- Return NEW to allow profile creation to continue
RETURN NEW;
END;
$$;

-- Add comprehensive documentation
COMMENT ON FUNCTION public.create_default_contexts_for_user() IS 
  'Automatically creates three default contexts (Professional, Social, Public) for new users on profile creation';

-- Log function creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 023: Created create_default_contexts_for_user() function';
END $$;

-- ===
-- STEP 2: Create trigger to fire after profile insertion
-- ===

-- Create trigger that fires after INSERT on profiles
-- This ensures every new profile gets default contexts automatically
CREATE TRIGGER trigger_create_default_contexts
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_default_contexts_for_user();

-- Log trigger creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 023: Created trigger_create_default_contexts on profiles table';
END $$;

-- ===
-- STEP 3: Backfill existing users who have no contexts
-- ===

-- Create default contexts for existing users who don't have any contexts yet
-- Uses the same ON CONFLICT DO NOTHING pattern for safety
DO $$
DECLARE
  user_record RECORD;
  context_count INTEGER;
  users_processed INTEGER := 0;
BEGIN
  -- Loop through all existing users who have no contexts
  FOR user_record IN 
SELECT p.id, p.email
FROM public.profiles p
LEFT JOIN public.user_contexts uc ON p.id = uc.user_id
WHERE uc.user_id IS NULL
  LOOP
-- Create default contexts for this user
INSERT INTO public.user_contexts (user_id, context_name, description, created_at, updated_at)
VALUES 
  (
user_record.id, 
'Professional', 
'Work and professional interactions', 
now(), 
now()
  ),
  (
user_record.id, 
'Social', 
'Friends and social networks', 
now(), 
now()
  ),
  (
user_record.id, 
'Public', 
'Public facing profiles and websites', 
now(), 
now()
  )
ON CONFLICT (user_id, context_name) DO NOTHING;

users_processed := users_processed + 1;

RAISE LOG 'TrueNamePath: Backfilled default contexts for existing user % (email: %)', 
  user_record.id, user_record.email;
  END LOOP;
  
  -- Log backfill results
  RAISE LOG 'TrueNamePath Migration 023: Backfilled default contexts for % existing users', users_processed;
  
  -- Validate backfill by counting total contexts created
  SELECT COUNT(*) INTO context_count
  FROM public.user_contexts
  WHERE context_name IN ('Professional', 'Social', 'Public');
  
  RAISE LOG 'TrueNamePath Migration 023: Total default contexts in database: %', context_count;
  
EXCEPTION
  WHEN OTHERS THEN
RAISE EXCEPTION 'TrueNamePath Migration 023: Backfill failed: %', SQLERRM;
END $$;

-- ===
-- STEP 4: Grant necessary permissions
-- ===

-- Ensure proper permissions for the function
GRANT EXECUTE ON FUNCTION public.create_default_contexts_for_user() TO postgres, service_role;

-- Ensure proper permissions on user_contexts table for the function
GRANT INSERT ON public.user_contexts TO postgres, service_role;

-- Log permissions granted
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 023: Granted necessary permissions for default context creation';
END $$;

-- ===
-- STEP 5: Validation and completion
-- ===

-- Validate migration success
DO $$
DECLARE
  function_exists BOOLEAN;
  trigger_exists BOOLEAN;
  total_users INTEGER;
  total_contexts INTEGER;
  avg_contexts_per_user NUMERIC;
BEGIN
  -- Check function exists
  SELECT EXISTS (
SELECT 1 FROM pg_proc 
WHERE proname = 'create_default_contexts_for_user'
  ) INTO function_exists;
  
  -- Check trigger exists
  SELECT EXISTS (
SELECT 1 FROM pg_trigger 
WHERE tgname = 'trigger_create_default_contexts'
  ) INTO trigger_exists;
  
  -- Get statistics
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO total_contexts FROM public.user_contexts;
  
  -- Calculate average contexts per user (should be close to 3)
  IF total_users > 0 THEN
avg_contexts_per_user := total_contexts::NUMERIC / total_users;
  ELSE
avg_contexts_per_user := 0;
  END IF;
  
  -- Validate results
  IF NOT function_exists THEN
RAISE EXCEPTION 'TrueNamePath Migration 023: Function create_default_contexts_for_user() not found';
  END IF;
  
  IF NOT trigger_exists THEN
RAISE EXCEPTION 'TrueNamePath Migration 023: Trigger trigger_create_default_contexts not found';
  END IF;
  
  -- Log validation results
  RAISE LOG 'TrueNamePath Migration 023: Validation successful';
  RAISE LOG '  ✅ Function created: create_default_contexts_for_user()';
  RAISE LOG '  ✅ Trigger created: trigger_create_default_contexts';
  RAISE LOG '  📊 Statistics: % users, % contexts (avg %.2f contexts per user)', 
total_users, total_contexts, avg_contexts_per_user;

END $$;

-- Log successful completion
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 023: Auto-Create Default Contexts COMPLETED SUCCESSFULLY';
  RAISE LOG '✅ Function created with SECURITY DEFINER and comprehensive error handling';
  RAISE LOG '✅ Trigger attached to profiles table for automatic context creation';
  RAISE LOG '✅ Existing users backfilled with default contexts';
  RAISE LOG '✅ Permissions granted for secure operation';
  RAISE LOG '🚀 Default contexts (Professional, Social, Public) now auto-created for all users';
  RAISE LOG '📝 Future users will automatically receive default contexts on profile creation';
END $$;

COMMIT;

-- ===
-- POST-MIGRATION NOTES
-- ===

-- This migration implements automatic default context creation for TrueNamePath:
--
-- KEY FEATURES:
-- ✅ Automatic context creation on profile insertion via trigger
-- ✅ Three professional default contexts: Professional, Social, Public
-- ✅ Backfill for existing users who have no contexts
-- ✅ SECURITY DEFINER for proper permissions isolation
-- ✅ ON CONFLICT DO NOTHING for graceful duplicate handling
-- ✅ Comprehensive error handling that doesn't break profile creation
-- ✅ Detailed logging for debugging and monitoring
--
-- DEFAULT CONTEXTS CREATED:
-- 🏢 Professional: "Work and professional interactions"
-- 👥 Social: "Friends and social networks"  
-- 🌐 Public: "Public facing profiles and websites"
--
-- OPERATION DETAILS:
-- • Trigger fires AFTER INSERT ON public.profiles
-- • Function uses SECURITY DEFINER for secure context creation
-- • Handles concurrent inserts and migration reruns safely
-- • Logs all operations for debugging and audit
-- • Does not break profile creation if context creation fails
--
-- TESTING VALIDATION:
-- • Test new user creation: should auto-create 3 default contexts
-- • Test existing users: should have contexts backfilled
-- • Test duplicate migration runs: should handle gracefully
-- • Test profile creation failure scenarios: should not break
--
-- ROLLBACK PROCEDURE:
-- If rollback is needed, run:
-- 1. DROP TRIGGER IF EXISTS trigger_create_default_contexts ON public.profiles;
-- 2. DROP FUNCTION IF EXISTS public.create_default_contexts_for_user();
-- 3. Optionally clean up default contexts: 
--DELETE FROM public.user_contexts WHERE context_name IN ('Professional', 'Social', 'Public');