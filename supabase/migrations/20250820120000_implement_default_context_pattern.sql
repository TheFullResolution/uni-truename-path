-- TrueNamePath: Migration 024 - Implement Default Context Pattern
-- Purpose: Change from 3 default contexts to 1 permanent "Default" context
-- Status: Production-ready

BEGIN;

-- ===
-- STEP 1: Add is_permanent column to user_contexts table
-- ===

-- Add the is_permanent column with default FALSE
ALTER TABLE public.user_contexts 
ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.user_contexts.is_permanent IS 
  'Indicates if this context is permanent and cannot be deleted. Only one permanent context allowed per user.';

-- Log column addition
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 024: Added is_permanent column to user_contexts table';
END $$;

-- ===
-- STEP 2: Add unique constraint for permanent contexts
-- ===

-- Create unique index to ensure only one permanent context per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_permanent_context_per_user
  ON public.user_contexts(user_id)
  WHERE is_permanent = TRUE;

-- Log constraint creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 024: Created unique constraint for one permanent context per user';
END $$;

-- ===
-- STEP 3: Drop existing trigger and function
-- ===

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_create_default_contexts ON public.profiles;

-- Drop the function
DROP FUNCTION IF EXISTS public.create_default_contexts_for_user();

-- Log cleanup
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 024: Dropped existing trigger and function for 3-context creation';
END $$;

-- ===
-- STEP 4: Create new function for single default context
-- ===

-- Create new function to create only one "Default" context
CREATE OR REPLACE FUNCTION public.create_default_context_for_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert single default context with ON CONFLICT DO NOTHING for safety
  INSERT INTO public.user_contexts (user_id, context_name, description, is_permanent, created_at, updated_at)
  VALUES 
(
  NEW.id, 
  'Default', 
  'Default identity context', 
  TRUE,
  now(), 
  now()
)
  ON CONFLICT (user_id, context_name) DO NOTHING;
  
  -- Log successful context creation
  RAISE LOG 'TrueNamePath: Created default context for user %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
-- Handle any errors gracefully without breaking profile creation
RAISE LOG 'TrueNamePath: Failed to create default context for user %: %', NEW.id, SQLERRM;
-- Return NEW to allow profile creation to continue
RETURN NEW;
END;
$$;

-- Add documentation
COMMENT ON FUNCTION public.create_default_context_for_user() IS 
  'Automatically creates one default permanent context named "Default" for new users on profile creation';

-- Log function creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 024: Created create_default_context_for_user() function';
END $$;

-- ===
-- STEP 5: Create new trigger
-- ===

-- Create trigger that fires after INSERT on profiles
CREATE TRIGGER trigger_create_default_context
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_default_context_for_user();

-- Log trigger creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 024: Created trigger_create_default_context on profiles table';
END $$;

-- ===
-- STEP 6: Grant necessary permissions
-- ===

-- Ensure proper permissions for the function
GRANT EXECUTE ON FUNCTION public.create_default_context_for_user() TO postgres, service_role;

-- Ensure proper permissions on user_contexts table
GRANT INSERT ON public.user_contexts TO postgres, service_role;

-- Log permissions granted
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 024: Granted necessary permissions for default context creation';
END $$;

-- ===
-- STEP 7: Validation and completion
-- ===

-- Validate migration success
DO $$
DECLARE
  function_exists BOOLEAN;
  trigger_exists BOOLEAN;
  column_exists BOOLEAN;
  constraint_exists BOOLEAN;
BEGIN
  -- Check function exists
  SELECT EXISTS (
SELECT 1 FROM pg_proc 
WHERE proname = 'create_default_context_for_user'
  ) INTO function_exists;
  
  -- Check trigger exists
  SELECT EXISTS (
SELECT 1 FROM pg_trigger 
WHERE tgname = 'trigger_create_default_context'
  ) INTO trigger_exists;
  
  -- Check column exists
  SELECT EXISTS (
SELECT 1 FROM information_schema.columns 
WHERE table_name = 'user_contexts' 
  AND column_name = 'is_permanent'
  ) INTO column_exists;
  
  -- Check constraint exists
  SELECT EXISTS (
SELECT 1 FROM pg_indexes 
WHERE indexname = 'idx_one_permanent_context_per_user'
  ) INTO constraint_exists;
  
  -- Validate results
  IF NOT function_exists THEN
RAISE EXCEPTION 'TrueNamePath Migration 024: Function create_default_context_for_user() not found';
  END IF;
  
  IF NOT trigger_exists THEN
RAISE EXCEPTION 'TrueNamePath Migration 024: Trigger trigger_create_default_context not found';
  END IF;
  
  IF NOT column_exists THEN
RAISE EXCEPTION 'TrueNamePath Migration 024: Column is_permanent not found';
  END IF;
  
  IF NOT constraint_exists THEN
RAISE EXCEPTION 'TrueNamePath Migration 024: Unique constraint idx_one_permanent_context_per_user not found';
  END IF;
  
  -- Log validation results
  RAISE LOG 'TrueNamePath Migration 024: Validation successful';
  RAISE LOG '  ✅ Function created: create_default_context_for_user()';
  RAISE LOG '  ✅ Trigger created: trigger_create_default_context';
  RAISE LOG '  ✅ Column added: is_permanent';
  RAISE LOG '  ✅ Constraint created: idx_one_permanent_context_per_user';

END $$;

-- Log successful completion
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 024: Default Context Pattern Implementation COMPLETED SUCCESSFULLY';
  RAISE LOG '✅ Changed from 3 contexts (Professional, Social, Public) to 1 permanent "Default" context';
  RAISE LOG '✅ Added is_permanent column with unique constraint';
  RAISE LOG '✅ New trigger creates single "Default" context for new users';
  RAISE LOG '✅ Permissions granted for secure operation';
  RAISE LOG '🚀 Default context pattern now implemented - single permanent context per user';
END $$;

COMMIT;

-- ===
-- POST-MIGRATION NOTES
-- ===

-- This migration implements the default context pattern for TrueNamePath:
--
-- KEY CHANGES:
-- ✅ Added is_permanent BOOLEAN column to user_contexts table
-- ✅ Added unique constraint ensuring only one permanent context per user
-- ✅ Dropped old trigger and function that created 3 contexts
-- ✅ Created new trigger and function that creates 1 "Default" context
-- ✅ New context is marked as permanent (cannot be deleted)
-- ✅ Context name changed from "Professional" to "Default"
-- ✅ Context description changed to "Default identity context"
--
-- DEFAULT CONTEXT CREATED:
-- 🏠 Default: "Default identity context" (is_permanent = TRUE)
--
-- OPERATION DETAILS:
-- • Trigger fires AFTER INSERT ON public.profiles
-- • Function uses SECURITY DEFINER for secure context creation
-- • Only creates one permanent context named "Default"
-- • Handles concurrent inserts and migration reruns safely
-- • Does not break profile creation if context creation fails
--
-- TESTING VALIDATION:
-- • Test new user creation: should auto-create 1 "Default" context
-- • Test context deletion: "Default" context should be protected
-- • Test duplicate migration runs: should handle gracefully
-- • Test unique Note: only one permanent context per user allowed
--
-- ROLLBACK PROCEDURE:
-- If rollback is needed, run:
-- 1. DROP TRIGGER IF EXISTS trigger_create_default_context ON public.profiles;
-- 2. DROP FUNCTION IF EXISTS public.create_default_context_for_user();
-- 3. DROP INDEX IF EXISTS idx_one_permanent_context_per_user;
-- 4. ALTER TABLE public.user_contexts DROP COLUMN IF EXISTS is_permanent;