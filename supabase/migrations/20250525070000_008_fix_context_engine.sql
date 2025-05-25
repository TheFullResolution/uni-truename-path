-- Fix the context engine to properly implement audience-aware name resolution

-- First, let's create a better resolve_name function that properly handles context
CREATE OR REPLACE FUNCTION public.resolve_name(
  p_profile uuid,
  p_audience text,
  p_purpose text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text;
  v_name_id uuid;
  v_has_consent boolean := false;
BEGIN
  -- Check if user has given consent for this specific audience
  SELECT EXISTS(
SELECT 1 FROM public.consents c 
WHERE c.profile_id = p_profile 
AND c.audience = p_audience 
AND c.granted = true
  ) INTO v_has_consent;

  -- Select the most appropriate name based on audience and consent
  SELECT n.name_text, n.id INTO v_name, v_name_id
  FROM public.names n
  WHERE n.profile_id = p_profile
  AND (
-- Case 1: Public names (always visible)
n.visibility = 'public'
OR
-- Case 2: User has given specific consent for this audience
(v_has_consent AND n.visibility IN ('internal', 'restricted'))
OR  
-- Case 3: HR gets legal names (special case)
(p_audience = 'hr' AND n.type = 'legal')
  )
  ORDER BY
-- Priority based on audience context
CASE p_audience
  WHEN 'hr' THEN 
CASE n.type 
  WHEN 'legal' THEN 1  -- HR sees legal names first
  WHEN 'preferred' THEN 2
  ELSE 3 
END
  WHEN 'slack' THEN
CASE n.type
  WHEN 'preferred' THEN 1  -- Slack sees preferred/nicknames
  WHEN 'nickname' THEN 1
  WHEN 'legal' THEN 3
  ELSE 2
END
  WHEN 'github' THEN
CASE n.type
  WHEN 'alias' THEN 1  -- GitHub sees aliases/usernames
  WHEN 'nickname' THEN 2
  WHEN 'preferred' THEN 3
  ELSE 4
END
  ELSE
CASE n.type   -- Default priority
  WHEN 'preferred' THEN 1
  WHEN 'nickname' THEN 2
  WHEN 'legal' THEN 3
  WHEN 'alias' THEN 4
  ELSE 5
END
END,
n.verified DESC,
n.created_at DESC
  LIMIT 1;

  -- Log the disclosure for audit trail
  IF v_name IS NOT NULL THEN
INSERT INTO public.name_disclosure_log
  (profile_id, name_id, audience, purpose, requested_by)
VALUES (p_profile, v_name_id, p_audience, p_purpose, auth.uid());
  END IF;

  -- Return the name or a fallback
  RETURN COALESCE(v_name, 'Anonymous User');
END $$;

-- Add more realistic consent and name data for better demos
INSERT INTO public.names (profile_id, name_text, type, visibility, verified, source) VALUES
  -- JJ gets more name variants
  ('11111111-1111-1111-1111-111111111111', 'J. Lewandowski', 'alias', 'public', false, 'github_username'),
  
  -- Li Wei gets more variants  
  ('22222222-2222-2222-2222-222222222222', 'Wei', 'nickname', 'internal', false, 'colleagues'),
  
  -- Alex gets better variants
  ('33333333-3333-3333-3333-333333333333', 'Alex', 'preferred', 'public', true, 'personal_preference')
ON CONFLICT DO NOTHING;

-- Add more realistic consent scenarios
INSERT INTO public.consents (profile_id, audience, purpose, granted) VALUES
  -- JJ consents
  ('11111111-1111-1111-1111-111111111111', 'github', 'code_collaboration', true),
  ('11111111-1111-1111-1111-111111111111', 'internal_systems', 'daily_operations', true),
  
  -- Li Wei consents  
  ('22222222-2222-2222-2222-222222222222', 'hr', 'employment_records', true),
  ('22222222-2222-2222-2222-222222222222', 'github', 'code_collaboration', false), -- explicitly denied
  ('22222222-2222-2222-2222-222222222222', 'internal_systems', 'daily_operations', true),
  
  -- Alex consents
  ('33333333-3333-3333-3333-333333333333', 'github', 'code_collaboration', true),
  ('33333333-3333-3333-3333-333333333333', 'slack', 'workplace_chat', true),
  ('33333333-3333-3333-3333-333333333333', 'hr', 'employment_records', false) -- Alex restricts HR access
ON CONFLICT DO NOTHING;