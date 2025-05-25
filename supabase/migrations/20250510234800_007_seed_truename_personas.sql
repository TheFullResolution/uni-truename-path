-- TrueNamePath Demo Personas: JJ, Li Wei, Alex
-- These personas demonstrate the multi-name identity scenarios

-- Insert demo profiles (only if they don't exist)
insert into public.profiles (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'jedrzej.lewandowski@university.ac.uk'),
  ('22222222-2222-2222-2222-222222222222', 'li.wei@university.ac.uk'),
  ('33333333-3333-3333-3333-333333333333', 'alex.smith@university.ac.uk')
ON CONFLICT (id) DO NOTHING;

-- JJ (Jędrzej) - Polish developer with nickname preference  
insert into public.names (profile_id, name_text, type, visibility, verified, source) values
  ('11111111-1111-1111-1111-111111111111', 'Jędrzej Lewandowski', 'legal', 'restricted', true, 'passport'),
  ('11111111-1111-1111-1111-111111111111', 'JJ', 'preferred', 'public', true, 'personal_preference'),
  ('11111111-1111-1111-1111-111111111111', 'J. Lewandowski', 'alias', 'internal', false, 'email_signature')
ON CONFLICT DO NOTHING;

-- Li Wei - Chinese name with Western adaptation
insert into public.names (profile_id, name_text, type, visibility, verified, source) values
  ('22222222-2222-2222-2222-222222222222', '李伟', 'legal', 'restricted', true, 'official_documents'),
  ('22222222-2222-2222-2222-222222222222', 'Wei Li', 'preferred', 'public', true, 'personal_preference'),
  ('22222222-2222-2222-2222-222222222222', 'Wei', 'nickname', 'internal', false, 'colleagues')
ON CONFLICT DO NOTHING;

-- Alex - Developer with online persona
insert into public.names (profile_id, name_text, type, visibility, verified, source) values
  ('33333333-3333-3333-3333-333333333333', 'Alex Smith', 'legal', 'restricted', true, 'birth_certificate'),
  ('33333333-3333-3333-3333-333333333333', 'Alex', 'preferred', 'public', true, 'personal_preference'),
  ('33333333-3333-3333-3333-333333333333', '@CodeAlex', 'alias', 'public', false, 'github_username')
ON CONFLICT DO NOTHING;

-- Demo consent scenarios
insert into public.consents (profile_id, audience, purpose, granted) values
  -- JJ gives consent for HR to see legal name (payroll), Slack to see nickname
  ('11111111-1111-1111-1111-111111111111', 'hr', 'payroll', true),
  ('11111111-1111-1111-1111-111111111111', 'slack', 'workplace_chat', true),
  
  -- Li Wei allows HR access but prefers nickname for internal systems  
  ('22222222-2222-2222-2222-222222222222', 'hr', 'employment_records', true),
  ('22222222-2222-2222-2222-222222222222', 'internal_systems', 'daily_operations', true),
  
  -- Alex allows public access for developer community but restricts HR
  ('33333333-3333-3333-3333-333333333333', 'github', 'code_collaboration', true),
  ('33333333-3333-3333-3333-333333333333', 'stackoverflow', 'technical_help', true)
ON CONFLICT DO NOTHING;