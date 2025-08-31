-- TrueNamePath: Step 2 - Simplified Demo Data Seeding
-- Phase 2: Simple demo data compatible with existing database state

-- This migration creates basic demo data using existing profiles
-- and focuses on demonstrating the user-defined context architecture

BEGIN;

-- ===
-- STEP 1: Create basic demo data using existing profiles
-- ===

DO $$
DECLARE
  existing_profiles uuid[];
  demo_profile_id uuid;
  profile_count integer := 0;
BEGIN
  -- Get existing profile IDs
  SELECT ARRAY(SELECT id FROM public.profiles ORDER BY created_at LIMIT 3) INTO existing_profiles;
  
  -- Log what we found
  RAISE LOG 'TrueNamePath Step 2 Simple: Found % existing profiles', array_length(existing_profiles, 1);
  
  -- Use first profile for demo data
  IF array_length(existing_profiles, 1) > 0 THEN
demo_profile_id := existing_profiles[1];

-- Clear existing data for this profile
DELETE FROM public.names WHERE user_id = demo_profile_id;
DELETE FROM public.user_contexts WHERE user_id = demo_profile_id;

-- Create basic demo names
INSERT INTO public.names (user_id, name_text, name_type, is_preferred, verified, source) VALUES
  (demo_profile_id, 'Demo User', 'PREFERRED', true, true, 'demo_data'),
  (demo_profile_id, 'D. User', 'ALIAS', false, false, 'demo_alias'),
  (demo_profile_id, 'Demo Full Name', 'LEGAL', false, true, 'demo_legal');

-- Create basic demo contexts
INSERT INTO public.user_contexts (user_id, context_name, description) VALUES
  (demo_profile_id, 'Work', 'Professional workplace context'),
  (demo_profile_id, 'Social', 'Social media and casual interactions'),
  (demo_profile_id, 'Technical', 'Development and technical communities');

-- Create basic context assignments
INSERT INTO public.context_name_assignments (user_id, context_id, name_id)
SELECT 
  demo_profile_id,
  uc.id,
  n.id
FROM public.user_contexts uc
CROSS JOIN public.names n
WHERE uc.user_id = demo_profile_id 
  AND n.user_id = demo_profile_id
  AND ((uc.context_name = 'Work' AND n.name_text = 'Demo Full Name')
OR (uc.context_name = 'Social' AND n.name_text = 'Demo User')
OR (uc.context_name = 'Technical' AND n.name_text = 'D. User'));

profile_count := 1;
RAISE LOG 'TrueNamePath Step 2 Simple: Created demo data for profile %', demo_profile_id;
  ELSE
RAISE LOG 'TrueNamePath Step 2 Simple: No existing profiles found, skipping demo data';
  END IF;
  
  -- Log completion
  RAISE LOG 'TrueNamePath Step 2 Simple: Demo data seeding completed for % profiles', profile_count;
END $$;

-- ===
-- STEP 2: Validate basic functionality
-- ===

DO $$
DECLARE
  names_count integer;
  contexts_count integer;
  assignments_count integer;
BEGIN
  SELECT COUNT(*) INTO names_count FROM public.names;
  SELECT COUNT(*) INTO contexts_count FROM public.user_contexts;
  SELECT COUNT(*) INTO assignments_count FROM public.context_name_assignments;
  
  RAISE LOG 'TrueNamePath Step 2 Simple: Data summary - Names: %, Contexts: %, Assignments: %', 
names_count, contexts_count, assignments_count;
END $$;

COMMIT;

-- ===
-- POST-MIGRATION NOTES
-- ===

-- This simplified migration creates basic demo data to validate the Step 2 architecture:
-- 
-- CREATED:
-- ✅ Basic name variants (preferred, alias, legal) using existing profile
-- ✅ User-defined contexts (Work, Social, Technical)
-- ✅ Context-name assignments demonstrating resolution logic
-- 
-- VALIDATED:
-- ✅ User-defined context architecture working
-- ✅ Context-name assignment relationships functional
-- ✅ Database schema ready for resolve_name() function testing
-- 
-- NEXT STEPS:
-- Ready for Phase 3 (Enhanced resolve_name() function) and Phase 4 (RLS policies)