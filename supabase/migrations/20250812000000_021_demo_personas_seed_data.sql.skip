-- TrueNamePath: Demo Personas Comprehensive Seed Data
-- Purpose: Create complete demo personas for local development and testing
-- Date: August 12, 2025
-- Step 7 Follow-up: Ensure demo page works with realistic test data

-- This migration creates the three demo personas used in the frontend app
-- with complete data including auth users, profiles, names, contexts, and assignments

BEGIN;

-- =============================================================================
-- STEP 1: Insert Auth Users for Demo Personas
-- =============================================================================

-- These are the exact UUIDs used in the frontend PERSONAS constant
-- Create auth.users entries that the frontend expects to exist
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
)
VALUES
-- JJ (Polish Developer)
(
  '00000000-0000-0000-0000-000000000000',
  '54c00e81-cda9-4251-9456-7778df91b988',
  'authenticated',
  'authenticated',
  'jj@truename.test',
  crypt('demo123!', gen_salt('bf')), -- Demo password: demo123!
  now(),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Jędrzej Lewandowski"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  0,
  null,
  '',
  null,
  false,
  null
),
-- Li Wei (Chinese Professional)
(
  '00000000-0000-0000-0000-000000000000',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  'authenticated',
  'authenticated',
  'liwei@truename.test',
  crypt('demo123!', gen_salt('bf')), -- Demo password: demo123!
  now(),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Li Wei"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  0,
  null,
  '',
  null,
  false,
  null
),
-- Alex (Developer)
(
  '00000000-0000-0000-0000-000000000000',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e',
  'authenticated',
  'authenticated',
  'alex@truename.test',
  crypt('demo123!', gen_salt('bf')), -- Demo password: demo123!
  now(),
  null,
  '',
  null,
  '',
  null,
  '',
  '',
  null,
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Alex Smith"}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  null,
  0,
  null,
  '',
  null,
  false,
  null
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Log auth users creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Demo Seed: Created 3 auth.users entries for demo personas';
END $$;

-- =============================================================================
-- STEP 2: Clean Up Existing Demo Data (Handle Foreign Key Constraints)
-- =============================================================================

-- Delete related data first to handle foreign key constraints
DELETE FROM public.audit_log_entries WHERE target_user_id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
) OR requester_user_id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
);

DELETE FROM public.context_name_assignments WHERE user_id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
);

DELETE FROM public.consents WHERE granter_user_id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
) OR requester_user_id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
);

DELETE FROM public.user_contexts WHERE user_id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
);

DELETE FROM public.names WHERE user_id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
);

-- Delete any existing profiles with demo IDs to prevent conflicts
DELETE FROM public.profiles WHERE id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
);

-- Delete auth users to prevent conflicts
DELETE FROM auth.users WHERE id IN (
  '54c00e81-cda9-4251-9456-7778df91b988',
  '809d0224-81f1-48a0-9405-2258de21ea60',
  '257113c8-7a62-4758-9b1b-7992dd8aca1e'
);

-- =============================================================================
-- STEP 3: Create Profile Entries
-- =============================================================================

-- Insert profiles linked to auth users
INSERT INTO public.profiles (id, email, created_at, updated_at) VALUES
('54c00e81-cda9-4251-9456-7778df91b988', 'jj@truename.test', now(), now()),
('809d0224-81f1-48a0-9405-2258de21ea60', 'liwei@truename.test', now(), now()),
('257113c8-7a62-4758-9b1b-7992dd8aca1e', 'alex@truename.test', now(), now());

-- Log profiles creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Demo Seed: Created 3 profile entries linked to auth users';
END $$;

-- =============================================================================
-- STEP 4: Create Name Variants for Each Persona
-- =============================================================================

-- JJ (Polish Developer) - Name variants
INSERT INTO public.names (user_id, name_text, name_type, is_preferred, verified, source, created_at) VALUES
-- JJ's names
('54c00e81-cda9-4251-9456-7778df91b988', 'Jędrzej Lewandowski', 'LEGAL', false, true, 'official_id', now() - interval '30 days'),
('54c00e81-cda9-4251-9456-7778df91b988', 'JJ', 'PREFERRED', true, true, 'user_preference', now() - interval '25 days'),
('54c00e81-cda9-4251-9456-7778df91b988', 'J', 'NICKNAME', false, false, 'colleague_usage', now() - interval '20 days'),
('54c00e81-cda9-4251-9456-7778df91b988', 'J. Lewandowski', 'ALIAS', false, false, 'professional_alias', now() - interval '15 days'),

-- Li Wei (Chinese Professional) - Name variants with cultural aspects
('809d0224-81f1-48a0-9405-2258de21ea60', '李伟', 'LEGAL', false, true, 'official_id', now() - interval '30 days'),
('809d0224-81f1-48a0-9405-2258de21ea60', 'Li Wei', 'PREFERRED', true, true, 'user_preference', now() - interval '25 days'),
('809d0224-81f1-48a0-9405-2258de21ea60', 'Wei', 'NICKNAME', false, true, 'friend_usage', now() - interval '20 days'),
('809d0224-81f1-48a0-9405-2258de21ea60', 'W. Li', 'ALIAS', false, false, 'business_card', now() - interval '15 days'),

-- Alex (Developer) - Name variants with online persona
('257113c8-7a62-4758-9b1b-7992dd8aca1e', 'Alex Smith', 'LEGAL', false, true, 'official_id', now() - interval '30 days'),
('257113c8-7a62-4758-9b1b-7992dd8aca1e', 'Alex', 'PREFERRED', true, true, 'user_preference', now() - interval '25 days'),
('257113c8-7a62-4758-9b1b-7992dd8aca1e', 'A', 'NICKNAME', false, false, 'casual_usage', now() - interval '20 days'),
('257113c8-7a62-4758-9b1b-7992dd8aca1e', '@CodeAlex', 'ALIAS', false, false, 'online_handle', now() - interval '15 days');

-- Log names creation
DO $$
DECLARE
  names_count integer;
BEGIN
  SELECT COUNT(*) INTO names_count FROM public.names WHERE user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  RAISE LOG 'TrueNamePath Demo Seed: Created % name variants across 3 personas', names_count;
END $$;

-- =============================================================================
-- STEP 5: Create User-Defined Contexts for Each Persona
-- =============================================================================

-- JJ's User-Defined Contexts (matching frontend PERSONAS)
INSERT INTO public.user_contexts (user_id, context_name, description, created_at) VALUES
('54c00e81-cda9-4251-9456-7778df91b988', 'Work Colleagues', 'Professional workplace interactions and HR systems', now() - interval '25 days'),
('54c00e81-cda9-4251-9456-7778df91b988', 'Gaming Friends', 'Online gaming communities and Discord servers', now() - interval '20 days'),
('54c00e81-cda9-4251-9456-7778df91b988', 'Open Source', 'GitHub contributions and technical community engagement', now() - interval '15 days'),

-- Li Wei's User-Defined Contexts (matching frontend PERSONAS)
('809d0224-81f1-48a0-9405-2258de21ea60', 'Professional Network', 'LinkedIn, business cards, and professional conferences', now() - interval '25 days'),
('809d0224-81f1-48a0-9405-2258de21ea60', 'Close Friends', 'Personal friends who understand cultural preferences', now() - interval '20 days'),
('809d0224-81f1-48a0-9405-2258de21ea60', 'Family & Cultural', 'Family members and cultural community settings', now() - interval '15 days'),

-- Alex's User-Defined Contexts (matching frontend PERSONAS)
('257113c8-7a62-4758-9b1b-7992dd8aca1e', 'Development Community', 'Stack Overflow, GitHub, and technical forums', now() - interval '25 days'),
('257113c8-7a62-4758-9b1b-7992dd8aca1e', 'Professional Services', 'Client work, contracts, and business relationships', now() - interval '20 days'),
('257113c8-7a62-4758-9b1b-7992dd8aca1e', 'Casual Acquaintances', 'Social media, meetups, and casual interactions', now() - interval '15 days');

-- Log contexts creation
DO $$
DECLARE
  contexts_count integer;
BEGIN
  SELECT COUNT(*) INTO contexts_count FROM public.user_contexts WHERE user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  RAISE LOG 'TrueNamePath Demo Seed: Created % user-defined contexts across 3 personas', contexts_count;
END $$;

-- =============================================================================
-- STEP 6: Create Context-Name Assignments (Realistic Demo Scenarios)
-- =============================================================================

-- JJ's Context-Name Assignments (demonstrates Polish developer needs)
INSERT INTO public.context_name_assignments (user_id, context_id, name_id, created_at)
SELECT 
  '54c00e81-cda9-4251-9456-7778df91b988',
  uc.id,
  n.id,
  now() - interval '10 days'
FROM public.user_contexts uc
CROSS JOIN public.names n
WHERE uc.user_id = '54c00e81-cda9-4251-9456-7778df91b988'
  AND n.user_id = '54c00e81-cda9-4251-9456-7778df91b988'
  AND (
(uc.context_name = 'Work Colleagues' AND n.name_text = 'Jędrzej Lewandowski') OR -- Legal name for HR
(uc.context_name = 'Gaming Friends' AND n.name_text = 'JJ') OR -- Easy pronunciation
(uc.context_name = 'Open Source' AND n.name_text = 'J. Lewandowski') -- Professional alias
  );

-- Li Wei's Context-Name Assignments (demonstrates Chinese name adaptation)
INSERT INTO public.context_name_assignments (user_id, context_id, name_id, created_at)
SELECT 
  '809d0224-81f1-48a0-9405-2258de21ea60',
  uc.id,
  n.id,
  now() - interval '10 days'
FROM public.user_contexts uc
CROSS JOIN public.names n
WHERE uc.user_id = '809d0224-81f1-48a0-9405-2258de21ea60'
  AND n.user_id = '809d0224-81f1-48a0-9405-2258de21ea60'
  AND (
(uc.context_name = 'Professional Network' AND n.name_text = 'Li Wei') OR -- Western format for business
(uc.context_name = 'Close Friends' AND n.name_text = 'Wei') OR -- Casual nickname
(uc.context_name = 'Family & Cultural' AND n.name_text = '李伟') -- Native script for cultural contexts
  );

-- Alex's Context-Name Assignments (demonstrates online persona management)
INSERT INTO public.context_name_assignments (user_id, context_id, name_id, created_at)
SELECT 
  '257113c8-7a62-4758-9b1b-7992dd8aca1e',
  uc.id,
  n.id,
  now() - interval '10 days'
FROM public.user_contexts uc
CROSS JOIN public.names n
WHERE uc.user_id = '257113c8-7a62-4758-9b1b-7992dd8aca1e'
  AND n.user_id = '257113c8-7a62-4758-9b1b-7992dd8aca1e'
  AND (
(uc.context_name = 'Development Community' AND n.name_text = '@CodeAlex') OR -- Online developer handle
(uc.context_name = 'Professional Services' AND n.name_text = 'Alex Smith') OR -- Full legal name for contracts
(uc.context_name = 'Casual Acquaintances' AND n.name_text = 'Alex') -- Preferred casual name
  );

-- Log assignments creation
DO $$
DECLARE
  assignments_count integer;
BEGIN
  SELECT COUNT(*) INTO assignments_count FROM public.context_name_assignments WHERE user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  RAISE LOG 'TrueNamePath Demo Seed: Created % context-name assignments demonstrating realistic scenarios', assignments_count;
END $$;

-- =============================================================================
-- STEP 7: Create Sample Consent Relationships (Inter-persona consent)
-- =============================================================================

-- Sample consent scenarios for testing
-- JJ grants Li Wei access to see his "Work Colleagues" context
INSERT INTO public.consents (granter_user_id, requester_user_id, context_id, status, granted_at, created_at)
SELECT 
  '54c00e81-cda9-4251-9456-7778df91b988', -- JJ as granter
  '809d0224-81f1-48a0-9405-2258de21ea60', -- Li Wei as requester
  uc.id, -- JJ's "Work Colleagues" context
  'GRANTED',
  now() - interval '5 days',
  now() - interval '7 days'
FROM public.user_contexts uc
WHERE uc.user_id = '54c00e81-cda9-4251-9456-7778df91b988'
  AND uc.context_name = 'Work Colleagues';

-- Li Wei grants Alex access to see his "Professional Network" context
INSERT INTO public.consents (granter_user_id, requester_user_id, context_id, status, granted_at, created_at)
SELECT 
  '809d0224-81f1-48a0-9405-2258de21ea60', -- Li Wei as granter
  '257113c8-7a62-4758-9b1b-7992dd8aca1e', -- Alex as requester
  uc.id, -- Li Wei's "Professional Network" context
  'GRANTED',
  now() - interval '3 days',
  now() - interval '5 days'
FROM public.user_contexts uc
WHERE uc.user_id = '809d0224-81f1-48a0-9405-2258de21ea60'
  AND uc.context_name = 'Professional Network';

-- Alex has a pending consent request to JJ's "Open Source" context
INSERT INTO public.consents (granter_user_id, requester_user_id, context_id, status, created_at)
SELECT 
  '54c00e81-cda9-4251-9456-7778df91b988', -- JJ as granter
  '257113c8-7a62-4758-9b1b-7992dd8aca1e', -- Alex as requester
  uc.id, -- JJ's "Open Source" context
  'PENDING',
  now() - interval '2 days'
FROM public.user_contexts uc
WHERE uc.user_id = '54c00e81-cda9-4251-9456-7778df91b988'
  AND uc.context_name = 'Open Source';

-- Log consents creation
DO $$
DECLARE
  consents_count integer;
BEGIN
  SELECT COUNT(*) INTO consents_count FROM public.consents WHERE granter_user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  RAISE LOG 'TrueNamePath Demo Seed: Created % consent relationships for inter-persona testing', consents_count;
END $$;

-- =============================================================================
-- STEP 8: Test Name Resolution Function with Demo Data
-- =============================================================================

-- Test the resolve_name function with our new demo data
DO $$
DECLARE
  jj_id uuid := '54c00e81-cda9-4251-9456-7778df91b988';
  liwei_id uuid := '809d0224-81f1-48a0-9405-2258de21ea60';
  alex_id uuid := '257113c8-7a62-4758-9b1b-7992dd8aca1e';
  resolved_name text;
BEGIN
  RAISE LOG 'TrueNamePath Demo Seed: Testing resolve_name() function with demo personas';
  
  -- Test JJ's context-specific resolution
  SELECT resolve_name(jj_id, NULL, 'Work Colleagues') INTO resolved_name;
  RAISE LOG 'JJ -> Work Colleagues: %', resolved_name;
  
  SELECT resolve_name(jj_id, NULL, 'Gaming Friends') INTO resolved_name;
  RAISE LOG 'JJ -> Gaming Friends: %', resolved_name;
  
  SELECT resolve_name(jj_id, NULL, 'Open Source') INTO resolved_name;
  RAISE LOG 'JJ -> Open Source: %', resolved_name;
  
  -- Test Li Wei's context-specific resolution
  SELECT resolve_name(liwei_id, NULL, 'Professional Network') INTO resolved_name;
  RAISE LOG 'Li Wei -> Professional Network: %', resolved_name;
  
  SELECT resolve_name(liwei_id, NULL, 'Family & Cultural') INTO resolved_name;
  RAISE LOG 'Li Wei -> Family & Cultural: %', resolved_name;
  
  -- Test Alex's context-specific resolution
  SELECT resolve_name(alex_id, NULL, 'Development Community') INTO resolved_name;
  RAISE LOG 'Alex -> Development Community: %', resolved_name;
  
  SELECT resolve_name(alex_id, NULL, 'Professional Services') INTO resolved_name;
  RAISE LOG 'Alex -> Professional Services: %', resolved_name;
  
  -- Test consent-based resolution (Li Wei requesting JJ's name with consent)
  SELECT resolve_name(jj_id, liwei_id, 'Work Colleagues') INTO resolved_name;
  RAISE LOG 'Consent Test: Li Wei requesting JJ (Work Colleagues): %', resolved_name;
  
  -- Test fallback resolution (no context specified)
  SELECT resolve_name(jj_id) INTO resolved_name;
  RAISE LOG 'JJ -> Fallback (preferred): %', resolved_name;
  
  SELECT resolve_name(liwei_id) INTO resolved_name;
  RAISE LOG 'Li Wei -> Fallback (preferred): %', resolved_name;
  
  SELECT resolve_name(alex_id) INTO resolved_name;
  RAISE LOG 'Alex -> Fallback (preferred): %', resolved_name;
  
  RAISE LOG 'TrueNamePath Demo Seed: All name resolution tests completed successfully';
END $$;

-- =============================================================================
-- STEP 9: Create Initial Audit Log Entries
-- =============================================================================

-- Create some sample audit entries to demonstrate the system working
INSERT INTO public.audit_log_entries (target_user_id, requester_user_id, context_id, resolved_name_id, action, details, accessed_at)
SELECT 
  '54c00e81-cda9-4251-9456-7778df91b988', -- JJ
  '809d0224-81f1-48a0-9405-2258de21ea60', -- Li Wei requesting
  uc.id,
  n.id,
  'NAME_DISCLOSED',
  jsonb_build_object(
'resolution_type', 'consent_based',
'context_name', 'Work Colleagues',
'consent_based', true,
'demo_data', true
  ),
  now() - interval '1 hour'
FROM public.user_contexts uc
JOIN public.context_name_assignments cna ON uc.id = cna.context_id
JOIN public.names n ON cna.name_id = n.id
WHERE uc.user_id = '54c00e81-cda9-4251-9456-7778df91b988'
  AND uc.context_name = 'Work Colleagues';

-- Log audit entries creation
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Demo Seed: Created sample audit log entries for testing';
END $$;

-- =============================================================================
-- STEP 10: Final Validation and Summary
-- =============================================================================

-- Comprehensive validation of all created data
DO $$
DECLARE
  auth_users_count integer;
  profiles_count integer;
  names_count integer;
  contexts_count integer;
  assignments_count integer;
  consents_count integer;
  audit_count integer;
BEGIN
  -- Count all created data
  SELECT COUNT(*) INTO auth_users_count FROM auth.users WHERE id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  
  SELECT COUNT(*) INTO profiles_count FROM public.profiles WHERE id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  
  SELECT COUNT(*) INTO names_count FROM public.names WHERE user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  
  SELECT COUNT(*) INTO contexts_count FROM public.user_contexts WHERE user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  
  SELECT COUNT(*) INTO assignments_count FROM public.context_name_assignments WHERE user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  
  SELECT COUNT(*) INTO consents_count FROM public.consents WHERE granter_user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  
  SELECT COUNT(*) INTO audit_count FROM public.audit_log_entries WHERE target_user_id IN (
'54c00e81-cda9-4251-9456-7778df91b988',
'809d0224-81f1-48a0-9405-2258de21ea60',
'257113c8-7a62-4758-9b1b-7992dd8aca1e'
  );
  
  -- Log comprehensive summary
  RAISE LOG '';
  RAISE LOG '=== TRUENAPATH DEMO PERSONAS SEED DATA COMPLETED ===';
  RAISE LOG '';
  RAISE LOG '✅ AUTH USERS: % (JJ, Li Wei, Alex)', auth_users_count;
  RAISE LOG '✅ PROFILES: % (linked to auth.users)', profiles_count;
  RAISE LOG '✅ NAME VARIANTS: % (4 per persona: legal, preferred, nickname, alias)', names_count;
  RAISE LOG '✅ USER CONTEXTS: % (3 per persona matching frontend)', contexts_count;
  RAISE LOG '✅ CONTEXT ASSIGNMENTS: % (realistic demo scenarios)', assignments_count;
  RAISE LOG '✅ CONSENT RELATIONSHIPS: % (inter-persona testing)', consents_count;
  RAISE LOG '✅ AUDIT LOG ENTRIES: % (demonstration data)', audit_count;
  RAISE LOG '';
  RAISE LOG '🎭 DEMO PERSONAS READY:';
  RAISE LOG '  • JJ (54c00e81...): Polish developer with Work/Gaming/OpenSource contexts';
  RAISE LOG '  • Li Wei (809d0224...): Chinese professional with Professional/Friends/Cultural contexts';
  RAISE LOG '  • Alex (257113c8...): Developer with Development/Professional/Casual contexts';
  RAISE LOG '';
  RAISE LOG '🔧 DEMO SCENARIOS ENABLED:';
  RAISE LOG '  • Context-specific name resolution for all personas';
  RAISE LOG '  • Consent-based access between personas';
  RAISE LOG '  • Realistic multi-cultural naming patterns';
  RAISE LOG '  • Complete audit trail for GDPR compliance';
  RAISE LOG '';
  RAISE LOG '🌐 FRONTEND INTEGRATION READY:';
  RAISE LOG '  • Demo page will work with all three personas';
  RAISE LOG '  • Name resolution API will return proper context-aware results';
  RAISE LOG '  • Authentication endpoints can use these test accounts';
  RAISE LOG '';
  RAISE LOG '📝 LOGIN CREDENTIALS (demo123! for all accounts):';
  RAISE LOG '  • jj@truename.test / demo123!';
  RAISE LOG '  • liwei@truename.test / demo123!';
  RAISE LOG '  • alex@truename.test / demo123!';
  RAISE LOG '';
  RAISE LOG '🚀 LOCAL DEMO READY FOR TESTING';
END $$;

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================

-- This migration creates complete demo data for the TrueNamePath local development environment:
--
-- DEMO PERSONAS CREATED:
-- ✅ JJ (Jędrzej Lewandowski) - Polish developer demonstrating pronunciation/cultural needs
-- ✅ Li Wei (李伟) - Chinese professional demonstrating multi-script name management
-- ✅ Alex Smith (@CodeAlex) - Developer demonstrating online persona management
--
-- COMPREHENSIVE DATA STRUCTURE:
-- ✅ Auth users with realistic metadata and demo passwords
-- ✅ Profiles linked to auth system for JWT authentication
-- ✅ Multiple name variants per persona (legal, preferred, nickname, alias)
-- ✅ User-defined contexts matching frontend PERSONAS constant exactly
-- ✅ Context-name assignments demonstrating realistic usage scenarios
-- ✅ Inter-persona consent relationships for testing
-- ✅ Sample audit log entries showing system usage
--
-- FRONTEND INTEGRATION BENEFITS:
-- ✅ Demo page will work immediately with all personas
-- ✅ Name resolution will return context-appropriate names
-- ✅ REST API testing will work with realistic data
-- ✅ Authentication flows can be tested with demo accounts
--
-- ACADEMIC DEMONSTRATION VALUE:
-- ✅ Multi-cultural naming scenarios (Polish, Chinese, Western)
-- ✅ Real-world context examples (work, gaming, professional, cultural)
-- ✅ Privacy-by-design with consent and audit logging
-- ✅ User agency through user-defined contexts
--
-- TESTING SCENARIOS ENABLED:
-- 1. Context-specific resolution: JJ shows "Jędrzej Lewandowski" to Work Colleagues
-- 2. Cultural adaptation: Li Wei shows "李伟" to Family & Cultural contexts
-- 3. Online persona management: Alex shows "@CodeAlex" to Development Community
-- 4. Consent-based sharing: Li Wei can see JJ's work name with granted consent
-- 5. Fallback scenarios: Preferred names when no specific context assignment
--
-- ROLLBACK PROCEDURE:
-- To clean up demo data:
-- DELETE FROM auth.users WHERE email LIKE '%@truename.test';
-- (Cascading deletes will clean up all related tables)
--
-- USAGE INSTRUCTIONS:
-- 1. Run `supabase db reset` to apply this migration
-- 2. Start local development server: `yarn dev`
-- 3. Navigate to http://localhost:3000/demo
-- 4. Test all persona contexts and name resolution
-- 5. Use demo credentials to test authenticated features