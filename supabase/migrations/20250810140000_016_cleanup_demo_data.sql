-- TrueNamePath: Step 2 Cleanup - Remove Demo Data and Seed Real Auth Users
-- Clean up fake demo data and create proper personas for authenticated users
-- Date: August 10, 2025

-- Real authenticated users:
-- alex@truename.test: 257113c8-7a62-4758-9b1b-7992dd8aca1e
-- liwei@truename.test: 809d0224-81f1-48a0-9405-2258de21ea60
-- jj@truename.test: 54c00e81-cda9-4251-9456-7778df91b988

BEGIN;

-- =============================================================================
-- STEP 1: Clean up all existing demo data
-- =============================================================================

DO $$
DECLARE
  profiles_deleted integer;
  names_deleted integer;
  contexts_deleted integer;
  assignments_deleted integer;
BEGIN
  -- Delete in dependency order to avoid foreign key violations
  
  -- Delete audit log entries
  DELETE FROM public.audit_log_entries;
  
  -- Delete consents
  DELETE FROM public.consents;
  
  -- Delete context name assignments
  DELETE FROM public.context_name_assignments;
  GET DIAGNOSTICS assignments_deleted = ROW_COUNT;
  
  -- Delete user contexts
  DELETE FROM public.user_contexts;
  GET DIAGNOSTICS contexts_deleted = ROW_COUNT;
  
  -- Delete names
  DELETE FROM public.names;
  GET DIAGNOSTICS names_deleted = ROW_COUNT;
  
  -- Delete profiles (this will only delete our fake demo profiles, not auth users)
  DELETE FROM public.profiles;
  GET DIAGNOSTICS profiles_deleted = ROW_COUNT;
  
  RAISE LOG 'Cleanup completed: % profiles, % names, % contexts, % assignments deleted', 
profiles_deleted, names_deleted, contexts_deleted, assignments_deleted;
END $$;

-- =============================================================================
-- STEP 2: Create profiles for real authenticated users
-- =============================================================================

DO $$
DECLARE
  jj_user_id uuid := '54c00e81-cda9-4251-9456-7778df91b988';
  liwei_user_id uuid := '809d0224-81f1-48a0-9405-2258de21ea60';
  alex_user_id uuid := '257113c8-7a62-4758-9b1b-7992dd8aca1e';
  
  jj_profile_created boolean := false;
  liwei_profile_created boolean := false;
  alex_profile_created boolean := false;
BEGIN
  -- Create profiles for real auth users
  -- Note: Only create if they don't already exist
  
  -- JJ Profile
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (jj_user_id, 'jj@truename.test', now(), now())
  ON CONFLICT (id) DO UPDATE SET 
email = EXCLUDED.email,
updated_at = now();
  jj_profile_created := true;
  
  -- Li Wei Profile  
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (liwei_user_id, 'liwei@truename.test', now(), now())
  ON CONFLICT (id) DO UPDATE SET 
email = EXCLUDED.email,
updated_at = now();
  liwei_profile_created := true;
  
  -- Alex Profile
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (alex_user_id, 'alex@truename.test', now(), now())
  ON CONFLICT (id) DO UPDATE SET 
email = EXCLUDED.email,
updated_at = now();
  alex_profile_created := true;
  
  RAISE LOG 'Real auth user profiles created: JJ=%, Li Wei=%, Alex=%', 
jj_profile_created, liwei_profile_created, alex_profile_created;
END $$;

-- =============================================================================
-- STEP 3: Seed JJ Persona (Polish Developer)
-- =============================================================================

DO $$
DECLARE
  jj_user_id uuid := '54c00e81-cda9-4251-9456-7778df91b988';
  jj_legal_name_id uuid;
  jj_preferred_name_id uuid;
  jj_alias_name_id uuid;
  
  jj_work_context_id uuid;
  jj_gaming_context_id uuid;
  jj_opensource_context_id uuid;
BEGIN
  -- JJ's Names (Polish Developer with pronunciation challenges)
  INSERT INTO public.names (user_id, name_text, name_type, is_preferred, verified, source) 
  VALUES 
(jj_user_id, 'Jędrzej Lewandowski', 'LEGAL', false, true, 'official_documents'),
(jj_user_id, 'JJ', 'PREFERRED', true, true, 'personal_preference'),
(jj_user_id, 'J. Lewandowski', 'ALIAS', false, false, 'github_profile');
  
  -- Get individual name IDs for assignments
  SELECT id INTO jj_legal_name_id FROM public.names 
  WHERE user_id = jj_user_id AND name_text = 'Jędrzej Lewandowski';
  
  SELECT id INTO jj_preferred_name_id FROM public.names 
  WHERE user_id = jj_user_id AND name_text = 'JJ';
  
  SELECT id INTO jj_alias_name_id FROM public.names 
  WHERE user_id = jj_user_id AND name_text = 'J. Lewandowski';
  
  -- JJ's User-Defined Contexts  
  INSERT INTO public.user_contexts (user_id, context_name, description) 
  VALUES 
(jj_user_id, 'Work Colleagues', 'HR and professional workplace interactions'),
(jj_user_id, 'Gaming Friends', 'Discord, Steam, and casual gaming communities'),  
(jj_user_id, 'Open Source', 'GitHub, Stack Overflow, technical contributions');
  
  -- Get individual context IDs for assignments
  SELECT id INTO jj_work_context_id FROM public.user_contexts 
  WHERE user_id = jj_user_id AND context_name = 'Work Colleagues';
  
  SELECT id INTO jj_gaming_context_id FROM public.user_contexts 
  WHERE user_id = jj_user_id AND context_name = 'Gaming Friends';
  
  SELECT id INTO jj_opensource_context_id FROM public.user_contexts 
  WHERE user_id = jj_user_id AND context_name = 'Open Source';
  
  -- JJ's Context-Name Assignments (User defines which name for which context)
  INSERT INTO public.context_name_assignments (user_id, context_id, name_id) 
  VALUES 
(jj_user_id, jj_work_context_id, jj_legal_name_id),-- Work → Legal name
(jj_user_id, jj_gaming_context_id, jj_preferred_name_id),   -- Gaming → JJ  
(jj_user_id, jj_opensource_context_id, jj_alias_name_id);   -- Open Source → J. Lewandowski

  RAISE LOG 'JJ persona created with % names, % contexts, % assignments', 3, 3, 3;
END $$;

-- =============================================================================
-- STEP 4: Seed Li Wei Persona (Chinese Professional)
-- =============================================================================

DO $$
DECLARE
  liwei_user_id uuid := '809d0224-81f1-48a0-9405-2258de21ea60';
  liwei_legal_name_id uuid;
  liwei_preferred_name_id uuid;
  liwei_nickname_name_id uuid;
  liwei_western_name_id uuid;
  
  liwei_professional_context_id uuid;
  liwei_friends_context_id uuid;
  liwei_cultural_context_id uuid;
BEGIN
  -- Li Wei's Names (Cross-cultural identity management)
  INSERT INTO public.names (user_id, name_text, name_type, is_preferred, verified, source) 
  VALUES 
(liwei_user_id, '李伟', 'LEGAL', false, true, 'chinese_id_card'),
(liwei_user_id, 'Li Wei', 'PREFERRED', true, true, 'personal_preference'),
(liwei_user_id, 'Wei', 'NICKNAME', false, true, 'friends_family'),
(liwei_user_id, 'Wei Li', 'ALIAS', false, false, 'western_business_cards');
  
  -- Get name IDs for assignments
  SELECT id INTO liwei_legal_name_id FROM public.names 
  WHERE user_id = liwei_user_id AND name_text = '李伟';
  
  SELECT id INTO liwei_preferred_name_id FROM public.names 
  WHERE user_id = liwei_user_id AND name_text = 'Li Wei';
  
  SELECT id INTO liwei_nickname_name_id FROM public.names 
  WHERE user_id = liwei_user_id AND name_text = 'Wei';
  
  SELECT id INTO liwei_western_name_id FROM public.names 
  WHERE user_id = liwei_user_id AND name_text = 'Wei Li';
  
  -- Li Wei's User-Defined Contexts
  INSERT INTO public.user_contexts (user_id, context_name, description) 
  VALUES 
(liwei_user_id, 'Professional Network', 'LinkedIn, business meetings, HR systems'),
(liwei_user_id, 'Close Friends', 'Personal friendships and social gatherings'),
(liwei_user_id, 'Family & Cultural', 'Family interactions and Chinese cultural community');
  
  -- Get context IDs for assignments  
  SELECT id INTO liwei_professional_context_id FROM public.user_contexts 
  WHERE user_id = liwei_user_id AND context_name = 'Professional Network';
  
  SELECT id INTO liwei_friends_context_id FROM public.user_contexts 
  WHERE user_id = liwei_user_id AND context_name = 'Close Friends';
  
  SELECT id INTO liwei_cultural_context_id FROM public.user_contexts 
  WHERE user_id = liwei_user_id AND context_name = 'Family & Cultural';
  
  -- Li Wei's Context-Name Assignments
  INSERT INTO public.context_name_assignments (user_id, context_id, name_id) 
  VALUES 
(liwei_user_id, liwei_professional_context_id, liwei_western_name_id),  -- Professional → Wei Li (Western order)
(liwei_user_id, liwei_friends_context_id, liwei_nickname_name_id),  -- Friends → Wei (nickname)
(liwei_user_id, liwei_cultural_context_id, liwei_legal_name_id);-- Cultural → 李伟 (Chinese characters)

  RAISE LOG 'Li Wei persona created with % names, % contexts, % assignments', 4, 3, 3;
END $$;

-- =============================================================================
-- STEP 5: Seed Alex Persona (Privacy-Conscious Developer)
-- =============================================================================

DO $$
DECLARE
  alex_user_id uuid := '257113c8-7a62-4758-9b1b-7992dd8aca1e';
  alex_legal_name_id uuid;
  alex_preferred_name_id uuid;
  alex_alias_name_id uuid;
  
  alex_dev_context_id uuid;
  alex_professional_context_id uuid;
  alex_casual_context_id uuid;
BEGIN
  -- Alex's Names (Privacy-focused developer)
  INSERT INTO public.names (user_id, name_text, name_type, is_preferred, verified, source) 
  VALUES 
(alex_user_id, 'Alexander Chen', 'LEGAL', false, true, 'legal_documents'),
(alex_user_id, 'Alex', 'PREFERRED', true, true, 'personal_preference'),
(alex_user_id, '@CodeAlex', 'ALIAS', false, false, 'online_handle');
  
  -- Get name IDs for assignments
  SELECT id INTO alex_legal_name_id FROM public.names 
  WHERE user_id = alex_user_id AND name_text = 'Alexander Chen';
  
  SELECT id INTO alex_preferred_name_id FROM public.names 
  WHERE user_id = alex_user_id AND name_text = 'Alex';
  
  SELECT id INTO alex_alias_name_id FROM public.names 
  WHERE user_id = alex_user_id AND name_text = '@CodeAlex';
  
  -- Alex's User-Defined Contexts (Privacy-conscious approach)
  INSERT INTO public.user_contexts (user_id, context_name, description) 
  VALUES 
(alex_user_id, 'Development Community', 'GitHub, tech forums, Stack Overflow'),
(alex_user_id, 'Professional Services', 'Client meetings, consulting work, invoicing'),
(alex_user_id, 'Casual Acquaintances', 'General networking, social media, meetups');
  
  -- Get context IDs for assignments
  SELECT id INTO alex_dev_context_id FROM public.user_contexts 
  WHERE user_id = alex_user_id AND context_name = 'Development Community';
  
  SELECT id INTO alex_professional_context_id FROM public.user_contexts 
  WHERE user_id = alex_user_id AND context_name = 'Professional Services';
  
  SELECT id INTO alex_casual_context_id FROM public.user_contexts 
  WHERE user_id = alex_user_id AND context_name = 'Casual Acquaintances';
  
  -- Alex's Context-Name Assignments
  INSERT INTO public.context_name_assignments (user_id, context_id, name_id) 
  VALUES 
(alex_user_id, alex_dev_context_id, alex_alias_name_id), -- Development → @CodeAlex (online persona)
(alex_user_id, alex_professional_context_id, alex_legal_name_id), -- Professional → Alexander Chen (legal name)
(alex_user_id, alex_casual_context_id, alex_preferred_name_id);   -- Casual → Alex (friendly but not too personal)

  RAISE LOG 'Alex persona created with % names, % contexts, % assignments', 3, 3, 3;
END $$;

-- =============================================================================
-- STEP 6: Create sample consent scenarios for testing
-- =============================================================================

DO $$
DECLARE
  jj_user_id uuid := '54c00e81-cda9-4251-9456-7778df91b988';
  liwei_user_id uuid := '809d0224-81f1-48a0-9405-2258de21ea60';
  alex_user_id uuid := '257113c8-7a62-4758-9b1b-7992dd8aca1e';
  
  jj_work_context_id uuid;
  liwei_professional_context_id uuid;
BEGIN
  -- Get context IDs for consent scenarios
  SELECT id INTO jj_work_context_id FROM public.user_contexts 
  WHERE user_id = jj_user_id AND context_name = 'Work Colleagues';
  
  SELECT id INTO liwei_professional_context_id FROM public.user_contexts 
  WHERE user_id = liwei_user_id AND context_name = 'Professional Network';
  
  -- Sample consent: Li Wei grants Alex access to her Professional Network context
  INSERT INTO public.consents (granter_user_id, requester_user_id, context_id, status, granted_at) 
  VALUES 
(liwei_user_id, alex_user_id, liwei_professional_context_id, 'GRANTED', now());
  
  -- Sample consent: JJ grants Li Wei access to his Work Colleagues context  
  INSERT INTO public.consents (granter_user_id, requester_user_id, context_id, status, granted_at) 
  VALUES 
(jj_user_id, liwei_user_id, jj_work_context_id, 'GRANTED', now());

  RAISE LOG 'Sample consent scenarios created for testing';
END $$;

-- =============================================================================
-- STEP 7: Validation and summary
-- =============================================================================

DO $$
DECLARE
  total_profiles integer;
  total_names integer;
  total_contexts integer;
  total_assignments integer;
  total_consents integer;
BEGIN
  -- Count final state
  SELECT COUNT(*) INTO total_profiles FROM public.profiles;
  SELECT COUNT(*) INTO total_names FROM public.names;
  SELECT COUNT(*) INTO total_contexts FROM public.user_contexts;
  SELECT COUNT(*) INTO total_assignments FROM public.context_name_assignments;
  SELECT COUNT(*) INTO total_consents FROM public.consents;
  
  RAISE LOG 'Database cleanup and real user seeding completed:';
  RAISE LOG '  Profiles: % (JJ, Li Wei, Alex)', total_profiles;
  RAISE LOG '  Names: % (10 total across all personas)', total_names;
  RAISE LOG '  User Contexts: % (9 total user-defined contexts)', total_contexts;
  RAISE LOG '  Context Assignments: % (direct user control)', total_assignments;
  RAISE LOG '  Sample Consents: % (for testing consent workflow)', total_consents;
  
  -- Verify all personas have proper data
  IF total_profiles = 3 AND total_names = 10 AND total_contexts = 9 AND total_assignments = 9 THEN
RAISE LOG 'SUCCESS: All real authenticated users properly seeded with academic personas';
  ELSE
RAISE WARNING 'Data mismatch detected - please verify seeding completed correctly';
  END IF;
END $$;

COMMIT;